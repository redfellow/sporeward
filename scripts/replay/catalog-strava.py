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

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('export', type=Path)
    parser.add_argument('--output', type=Path, help='Private catalogue location, normally inside ignored work/replay.')
    args = parser.parse_args()
    result = catalogue(args.export)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        descriptor = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(descriptor, 'w') as target:
            json.dump(result, target, indent=2)
            target.write('\n')
        os.chmod(args.output, 0o600)
    print(json.dumps(result['summary'], indent=2))

if __name__ == '__main__':
    main()
