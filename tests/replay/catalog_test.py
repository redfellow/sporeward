import csv
import gzip
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec=importlib.util.spec_from_file_location('gps_catalogue',Path(__file__).resolve().parents[2]/'scripts/replay/catalog-strava.py')
catalogue=importlib.util.module_from_spec(spec);spec.loader.exec_module(catalogue)

def gpx(times):
 return '<gpx><trk><trkseg>'+''.join('<trkpt lat="61.5" lon="23.75"><time>'+t+'</time></trkpt>' for t in times)+'</trkseg></trk></gpx>'

class OriginalGpsCatalogue(unittest.TestCase):
 def test_original_compressed_track_is_checked_by_replay_validator(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'original.gpx.gz';p.write_bytes(gzip.compress(gpx(['2026-01-01T00:00:00Z','2026-01-01T00:00:01Z']).encode()))
   result=catalogue.inspect_source(p)
   self.assertEqual(result['status'],'usable');self.assertEqual(result['summary']['fixes'],2)
   self.assertEqual(result['summary']['maximumGpsGapMs'],1000);self.assertEqual(result['bounds']['west'],23.75)
   self.assertNotIn('fixes',result)
 def test_no_gps_and_invalid_timing_remain_distinct(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'original.gpx';p.write_text(gpx([]));self.assertEqual(catalogue.inspect_source(p)['status'],'no-gps')
   p.write_text(gpx(['2026-01-01T00:00:01Z','2026-01-01T00:00:00Z']));self.assertEqual(catalogue.inspect_source(p)['status'],'invalid')
 def test_csv_catalogue_reads_only_selected_fields_and_rejects_escape(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);(root/'original.gpx').write_text(gpx([]))
   def write(path):
    with (root/'activities.csv').open('w') as f:
     w=csv.writer(f);w.writerow(['Activity ID','Activity Date','Activity Type','Filename','Description','Distance','Distance'])
     w.writerow(['123','Jan 1, 2026, 1:00:00 PM','Walk',path,'unrelated-private-detail','1','2'])
   write('original.gpx');result=catalogue.catalogue(root)
   self.assertNotIn('unrelated-private-detail',json.dumps(result));self.assertTrue(result['activities'][0]['candidateMode'])
   write('../outside.gpx')
   with self.assertRaisesRegex(ValueError,'escapes'):catalogue.catalogue(root)
 def test_private_atomic_checkpoint_has_no_group_or_world_access(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'catalog.json';catalogue.save_catalogue({'version':1},p)
   self.assertEqual(p.stat().st_mode&0o777,0o600);self.assertEqual(json.loads(p.read_text()),{'version':1})

if __name__=='__main__':unittest.main()
