#!/usr/bin/env python3
"""Filter a published OSM PBF locally; retain road geometry/access tags only."""
import argparse, datetime, gzip, json
from pathlib import Path
import osmium
parser=argparse.ArgumentParser()
parser.add_argument('source',type=Path)
parser.add_argument('--output',type=Path,default=Path('apps/server/data/tampere-region-access.json.gz'))
args=parser.parse_args()
bounds=dict(west=23.38,south=61.38,east=24.20,north=61.62)
keys=('highway','access','foot','bicycle','construction','proposed','service')
class Extract(osmium.SimpleHandler):
 def __init__(self):
  super().__init__(); self.nodes={}; self.ways=[]
 def node(self,n):
  if n.location.valid() and bounds['west']-.02<=n.location.lon<=bounds['east']+.02 and bounds['south']-.02<=n.location.lat<=bounds['north']+.02:
   self.nodes[n.id]=(n.location.lon,n.location.lat)
 def way(self,w):
  if 'highway' not in w.tags: return
  geometry=[self.nodes.get(n.ref) for n in w.nodes]
  if len(geometry)<2 or not any(p and bounds['west']<=p[0]<=bounds['east'] and bounds['south']<=p[1]<=bounds['north'] for p in geometry): return
  # Only retain complete ways. The padded node window retains local boundary
  # crossings without fabricating connectors across missing geometry.
  if any(p is None for p in geometry): return
  self.ways.append(dict(id=w.id,tags={k:w.tags[k] for k in keys if k in w.tags},geometry=[dict(lon=p[0],lat=p[1]) for p in geometry]))
handler=Extract();handler.apply_file(str(args.source))
if not handler.ways: raise SystemExit('No complete regional roads found')
data=dict(version=1,bounds=bounds,source='https://www.openstreetmap.org',downloadSource='https://download.geofabrik.de/europe/finland.html',license='ODbL-1.0',attribution='© OpenStreetMap contributors',snapshot=datetime.datetime.now(datetime.timezone.utc).isoformat(),ways=sorted(handler.ways,key=lambda w:w['id']))
args.output.parent.mkdir(parents=True,exist_ok=True)
with gzip.open(args.output,'wt') as f: json.dump(data,f,separators=(',',':'))
print(json.dumps(dict(ways=len(handler.ways),bounds=bounds,output=str(args.output))))
