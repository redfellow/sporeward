#!/usr/bin/env python3
"""Catalogue a private Strava export without copying tracks or unrelated data.

python3 scripts/replay/catalog-strava.py /path/to/export --output work/replay/catalog.json
CSV dates are display metadata, not replay timestamps; track timestamps own timing.
"""
import argparse
import collections
import csv
import datetime
import json
import os
import hashlib
import importlib.util
import concurrent.futures
from pathlib import Path

FORMATS = {'.fit', '.fit.gz', '.gpx', '.gpx.gz', '.tcx', '.tcx.gz'}
MODES = {'Walk', 'Run', 'Ride', 'E-Bike Ride'}

def catalogue(root):
    root = Path(root).expanduser().resolve()
    with (root / 'activities.csv').open(newline='', encoding='utf-8-sig') as source:
        reader = csv.reader(source)
        columns = next(reader)
        required = ['Activity ID', 'Activity Date', 'Activity Type', 'Filename']
        if any(name not in columns for name in required):
            raise ValueError('Export activities.csv is missing required columns.')
        # Strava duplicates several metric headers. Select named columns explicitly.
        indexes = {name: columns.index(name) for name in required}
        activities = []
        for line, row in enumerate(reader, start=2):
            if not row:
                continue
            if len(row) != len(columns):
                raise ValueError('Malformed activity CSV row %s.' % line)
            fields = {name: row[index] for name, index in indexes.items()}
            filename = fields['Filename']
            path = (root / filename).resolve() if filename else None
            if path is not None and not path.is_relative_to(root):
                raise ValueError('Activity file escapes the export directory at row %s.' % line)
            extension = ''.join(path.suffixes).lower() if path else None
            date = None
            try:
                date = datetime.datetime.strptime(fields['Activity Date'], '%b %d, %Y, %I:%M:%S %p').date().isoformat()
            except ValueError:
                pass
            activities.append({
                'id': fields['Activity ID'], 'type': fields['Activity Type'],
                'calendarDate': date, 'source': filename or None,
                'format': extension, 'present': bool(path and path.is_file()),
                'supportedFormat': extension in FORMATS,
                'candidateMode': fields['Activity Type'] in MODES,
                'gpsInspected': False,
            })
    dates = sorted(a['calendarDate'] for a in activities if a['calendarDate'])
    return {'version': 1, 'sourceRoot': str(root), 'summary': {
        'activities': len(activities),
        'candidateModes': sum(a['candidateMode'] for a in activities),
        'referencedFiles': sum(a['source'] is not None for a in activities),
        'presentFiles': sum(a['present'] for a in activities),
        'firstDate': dates[0] if dates else None, 'lastDate': dates[-1] if dates else None,
        'types': dict(collections.Counter(a['type'] for a in activities)),
        'formats': dict(collections.Counter(a['format'] for a in activities if a['format'])),
    }, 'activities': activities}

def save_catalogue(result, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + '.tmp')
    descriptor = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(descriptor, 'w') as target:
        json.dump(result, target, indent=2)
        target.write('\n')
    os.chmod(temporary, 0o600)
    os.replace(temporary, path)


def inspect_source(path):
    # Use exactly the same normalization/validation as actual replay import.
    spec = importlib.util.spec_from_file_location('replay_import', Path(__file__).with_name('import-track.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    digest = hashlib.sha256(Path(path).read_bytes()).hexdigest()
    try:
        track = module.normalize(path)
        fixes = track['fixes']
        return {'version': 1, 'sha256': digest, 'status': 'usable',
                'summary': track['summary'],
                'bounds': {'west': min(f['longitude'] for f in fixes),
                           'south': min(f['latitude'] for f in fixes),
                           'east': max(f['longitude'] for f in fixes),
                           'north': max(f['latitude'] for f in fixes)}}
    except Exception as error:
        message = str(error)
        if 'FIT support requires' in message:
            raise
        status = 'no-gps' if 'no usable timestamped GPS' in message else 'invalid'
        # No decoded source fields, health data or coordinates in errors.
        return {'version': 1, 'sha256': digest, 'status': status,
                'reason': message if isinstance(error, ValueError) else type(error).__name__}


def inspect_catalogue(result, output, workers, previous=None):
    cached = {a['id']: a for a in (previous or {}).get('activities', [])}
    work = []
    for activity in result['activities']:
        if not (activity['present'] and activity['supportedFormat'] and activity['candidateMode']):
            continue
        path = Path(result['sourceRoot']) / activity['source']
        old = cached.get(activity['id'], {}).get('gpsInspection', {})
        if old.get('version') == 1 and old.get('sha256') == hashlib.sha256(path.read_bytes()).hexdigest():
            activity.update(gpsInspected=True, gpsInspection=old)
        else:
            work.append((activity, path))
    completed = 0
    with concurrent.futures.ProcessPoolExecutor(max_workers=workers) as pool:
        pending = {pool.submit(inspect_source, str(path)): activity for activity, path in work}
        for future in concurrent.futures.as_completed(pending):
            activity = pending[future]
            activity.update(gpsInspected=True, gpsInspection=future.result())
            completed += 1
            if completed % 25 == 0:
                inspection_summary(result)
                save_catalogue(result, output)
                print('GPS inspected %s/%s new sources' % (completed, len(work)), flush=True)
    inspection_summary(result)
    save_catalogue(result, output)


def inspection_summary(result):
    inspected = [a for a in result['activities'] if a['gpsInspected']]
    result['summary']['gpsInspected'] = len(inspected)
    result['summary']['gpsResults'] = dict(collections.Counter(a['gpsInspection']['status'] for a in inspected))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('export', type=Path)
    parser.add_argument('--output', type=Path, help='Private catalogue location, normally inside ignored work/replay.')
    parser.add_argument('--inspect-gps', action='store_true', help='Validate original candidate recordings; resume cached inspection by content hash.')
    parser.add_argument('--workers', type=int, default=2)
    parser.add_argument('--bounds', help='Filter GPS listing by intersecting west,south,east,north bounds.')
    parser.add_argument('--limit', type=int, default=20, help='Maximum GPS listing rows (default 20).')
    parser.add_argument('--list-gps', action='store_true', help='List validated recording IDs, modes and timing summaries, without coordinates.')
    args = parser.parse_args()
    bounds = None
    if args.bounds:
        try:
            bounds = [float(v) for v in args.bounds.split(',')]
            if len(bounds) != 4 or not -180 <= bounds[0] < bounds[2] <= 180 or not -90 <= bounds[1] < bounds[3] <= 90:
                raise ValueError()
        except ValueError:
            parser.error('--bounds requires valid west,south,east,north coordinates.')
    if args.limit < 1:
        parser.error('--limit must be positive.')
    if args.workers < 1 or args.workers > 4:
        parser.error('Use 1–4 inspection workers.')
    if args.inspect_gps and not args.output:
        parser.error('--inspect-gps requires a private --output checkpoint.')
    previous = json.loads(args.output.read_text()) if args.output and args.output.exists() else None
    result = catalogue(args.export)
    if args.inspect_gps:
        inspect_catalogue(result, args.output, args.workers,
                          previous if previous and previous.get('sourceRoot') == result['sourceRoot'] else None)
    else:
        # Preserve validated metadata when listing an unchanged export.
        if previous and previous.get('sourceRoot') == result['sourceRoot']:
            cached = {a['id']: a for a in previous['activities']}
            for activity in result['activities']:
                old = cached.get(activity['id'], {})
                if old.get('source') == activity['source'] and old.get('gpsInspected') and activity['present'] and old['gpsInspection'].get('sha256') == hashlib.sha256((Path(result['sourceRoot']) / activity['source']).read_bytes()).hexdigest():
                    activity.update(gpsInspected=True, gpsInspection=old['gpsInspection'])
            inspection_summary(result)
        if args.output:
            save_catalogue(result, args.output)
    print(json.dumps(result['summary'], indent=2))
    if args.list_gps:
        shown = 0
        for activity in result['activities']:
            inspected = activity.get('gpsInspection', {})
            if inspected.get('status') == 'usable':
                b = inspected['bounds']
                if bounds and (b['east'] < bounds[0] or b['west'] > bounds[2] or b['north'] < bounds[1] or b['south'] > bounds[3]):
                    continue
                if shown >= args.limit:
                    break
                shown += 1
                summary = inspected['summary']
                print(json.dumps({'id': activity['id'], 'type': activity['type'],
                                  'fixes': summary['fixes'], 'durationMs': summary['durationMs'],
                                  'maximumGpsGapMs': summary['maximumGpsGapMs'], 'sections': summary['sections']}))


if __name__ == '__main__':
    main()
