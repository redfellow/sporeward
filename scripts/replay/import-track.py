#!/usr/bin/env python3
"""Normalize an original recording into a private, timestamped replay track."""
import argparse
import datetime as dt
import gzip
import hashlib
import json
import math
import os
from pathlib import Path
import xml.etree.ElementTree as ET


def timestamp(value):
    if isinstance(value, (int, float)):
        return int(value)
    if isinstance(value, str):
        value = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
    if value.tzinfo is None:
        value = value.replace(tzinfo=dt.timezone.utc)
    return round(value.timestamp() * 1000)


def point(time, lat, lon, segment, accuracy=None):
    time, lat, lon = timestamp(time), float(lat), float(lon)
    if not all(math.isfinite(v) for v in [time, lat, lon]) or time <= 0 or abs(lat) > 90 or abs(lon) > 180:
        raise ValueError('Invalid timestamped GPS fix.')
    return {'timestamp': time, 'latitude': lat, 'longitude': lon, 'segment': segment, 'accuracy': accuracy}


def xml_track(stream, kind):
    root = ET.parse(stream).getroot()
    # Strip XML namespaces, including vendor extensions, for structural lookup.
    for node in root.iter():
        node.tag = node.tag.split('}')[-1]
    parts = root.findall('.//trkseg') if kind == 'gpx' else root.findall('.//Track')
    fixes, sections = [], []
    skipped = 0
    for index, part in enumerate(parts, 1):
        current = []
        for node in part.findall('trkpt' if kind == 'gpx' else 'Trackpoint'):
            time = node.findtext('time' if kind == 'gpx' else 'Time')
            lat = node.get('lat') if kind == 'gpx' else node.findtext('Position/LatitudeDegrees')
            lon = node.get('lon') if kind == 'gpx' else node.findtext('Position/LongitudeDegrees')
            if time is None or lat is None or lon is None:
                skipped += 1
                continue
            current.append(point(time, lat, lon, index))
        if current:
            fixes.extend(current)
            sections.append({'id': index, 'started': current[0]['timestamp'], 'ended': current[-1]['timestamp']})
    return fixes, sections, [], {'missingTimeOrPosition': skipped}


def fit_track(stream):
    try:
        import fitdecode
    except ImportError as error:
        raise ValueError('FIT support requires scripts/replay/requirements.txt in the replay virtualenv.') from error
    records, events, session_starts, session_ends = [], [], [], []
    skipped = 0
    with fitdecode.FitReader(stream) as reader:
        for frame in reader:
            if not isinstance(frame, fitdecode.FitDataMessage):
                continue
            get = lambda name: frame.get_value(name, fallback=None)
            if frame.name == 'session':
                if get('start_time') is not None:
                    session_starts.append(timestamp(get('start_time')))
                if get('timestamp') is not None:
                    session_ends.append(timestamp(get('timestamp')))
            elif frame.name == 'event' and get('event') == 'timer' and get('timestamp') is not None:
                event_type = get('event_type')
                if event_type == 'start' or str(event_type).startswith('stop'):
                    events.append({'timestamp': timestamp(get('timestamp')), 'kind': 'resume' if event_type == 'start' else 'pause'})
            elif frame.name == 'record':
                if get('timestamp') is None or get('position_lat') is None or get('position_long') is None:
                    skipped += 1
                    continue
                records.append(point(get('timestamp'), get('position_lat') * 180 / 2**31,
                                     get('position_long') * 180 / 2**31, 0, get('gps_accuracy')))
    if not records:
        return [], [], events, {'missingTimeOrPosition': skipped, 'excludedWhilePaused': 0}
    events.sort(key=lambda e: e['timestamp'])
    started = min(session_starts + [records[0]['timestamp']])
    ended = max(session_ends + [records[-1]['timestamp']])
    outside_events = sum(not started <= e['timestamp'] <= ended for e in events)
    events = [e for e in events if started <= e['timestamp'] <= ended]
    # Timer events are explicit pauses; sparse records alone are only GPS gaps.
    sections, open_at = [], started
    for event in events:
        time = event['timestamp']
        if event['kind'] == 'pause' and open_at is not None:
            sections.append({'id': len(sections)+1, 'started': open_at, 'ended': max(open_at, time)})
            open_at = None
        elif event['kind'] == 'resume' and open_at is None:
            open_at = time
    if open_at is not None:
        sections.append({'id': len(sections)+1, 'started': open_at, 'ended': max(open_at, ended)})
    fixes, excluded = [], 0
    for fix in records:
        section = next((s for s in reversed(sections) if s['started'] <= fix['timestamp'] <= s['ended']), None)
        if section:
            fixes.append({**fix, 'segment': section['id']})
        else:
            excluded += 1
    return fixes, sections, events, {'missingTimeOrPosition': skipped, 'excludedWhilePaused': excluded, 'timerEventsOutsideActivity': outside_events, '_bounds': [started, ended]}


def json_track(stream):
    data = json.load(stream)
    activity = data['activity']
    if activity.get('ended') is None:
        raise ValueError('Finish the recording before using it as a replay source.')
    sections = activity.get('sections', data.get('segments', []))
    sections = [{'id': s['id'], 'started': s['started'], 'ended': s['ended']} for s in sections]
    fixes = [point(f['timestamp'], f['latitude'], f['longitude'], f['segment'], f.get('accuracy')) for f in data['fixes']]
    return fixes, sections, [], {'missingTimeOrPosition': 0, '_bounds': [activity['started'], activity['ended']]}


def normalize(path):
    path = Path(path).expanduser().resolve()
    suffixes = path.suffixes
    kind = suffixes[-2][1:] if suffixes[-1] == '.gz' else suffixes[-1][1:]
    with (gzip.open(path, 'rb') if suffixes[-1] == '.gz' else path.open('rb')) as source:
        if kind in ['gpx', 'tcx']:
            fixes, sections, events, skipped = xml_track(source, kind)
        elif kind == 'fit':
            fixes, sections, events, skipped = fit_track(source)
        elif kind == 'json':
            fixes, sections, events, skipped = json_track(source)
        else:
            raise ValueError('Supported sources: FIT, GPX, TCX, their gzip variants, and Sporeward JSON.')
    deduplicated = []
    duplicates = 0
    for fix in fixes:
        if deduplicated and fix == deduplicated[-1]:
            duplicates += 1
        else:
            deduplicated.append(fix)
    fixes = deduplicated
    skipped['identicalDuplicateFixesRemoved'] = duplicates
    previous = -1
    by_id = {s['id']: s for s in sections}
    for fix in fixes:
        section = by_id.get(fix['segment'])
        if fix['timestamp'] <= previous:
            raise ValueError('Source timestamps are duplicate or out of order; repair explicitly rather than silently rewriting them.')
        if not section or not section['started'] <= fix['timestamp'] <= section['ended']:
            raise ValueError('Fix outside its recording section.')
        previous = fix['timestamp']
    if not fixes:
        raise ValueError('This recording contains no usable timestamped GPS positions.')
    sections.sort(key=lambda s: s['started'])
    for a, b in zip(sections, sections[1:]):
        if a['ended'] > b['started']:
            raise ValueError('Recording sections overlap.')
    start, end = skipped.pop('_bounds', [sections[0]['started'], sections[-1]['ended']])
    if start > sections[0]['started'] or end < sections[-1]['ended']:
        raise ValueError('Activity boundaries do not contain its recording sections.')
    gaps = [b['timestamp']-a['timestamp'] for a,b in zip(fixes, fixes[1:]) if a['segment'] == b['segment']]
    return {'version': 1, 'source': {'name': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'format': kind},
            'started': start, 'ended': end, 'sections': sections, 'fixes': fixes, 'events': events,
            'summary': {'fixes': len(fixes), 'sections': len(sections), 'durationMs': end-start,
                        'gpsGapsOver2s': sum(g > 2000 for g in gaps), 'maximumGpsGapMs': max(gaps, default=0), **skipped}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path, nargs='?')
    parser.add_argument('--catalog', type=Path)
    parser.add_argument('--activity', help='Activity ID from the private catalogue')
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    source = args.source
    if args.catalog or args.activity:
        if source or not args.catalog or not args.activity:
            parser.error('Use a source path OR --catalog and --activity together.')
        catalog = json.loads(args.catalog.read_text())
        activity = next((a for a in catalog['activities'] if a['id'] == args.activity), None)
        if not activity or not activity['present'] or not activity['supportedFormat']:
            parser.error('Activity has no available supported recording.')
        root = Path(catalog['sourceRoot']).resolve()
        source = (root / activity['source']).resolve()
        if not source.is_relative_to(root):
            parser.error('Activity source escapes its export directory.')
    if source is None:
        parser.error('Supply a source recording.')
    result = normalize(source)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    descriptor = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(descriptor, 'w') as target:
        json.dump(result, target, separators=(',', ':'))
        target.write('\n')
    os.chmod(args.output, 0o600)
    print(json.dumps(result['summary'], indent=2))

if __name__ == '__main__':
    main()
