#!/usr/bin/env python3
"""Extract public OSM water multipolygons, retaining islands, for shoreline constraints."""
import argparse, datetime, gzip, json
from pathlib import Path
import osmium
from shapely.geometry import shape, mapping, box
from shapely import make_valid
parser=argparse.ArgumentParser()
parser.add_argument('source',type=Path)
parser.add_argument('--output',type=Path,default=Path('apps/server/data/tampere-region-water.json.gz'))
args=parser.parse_args()
bounds=dict(west=23.38,south=61.27,east=24.20,north=61.62)
region=box(bounds['west']-.01,bounds['south']-.01,bounds['east']+.01,bounds['north']+.01)
factory=osmium.geom.GeoJSONFactory()
class Extract(osmium.SimpleHandler):
 def __init__(self): super().__init__(); self.polygons=[]; self.areas=0
 def area(self,a):
  if not (a.tags.get('natural')=='water' or a.tags.get('waterway')=='riverbank' or a.tags.get('landuse') in ('reservoir','basin')): return
  points=[(n.lon,n.lat) for ring in a.outer_rings() for n in ring if n.location.valid()]
  if not points: return
  xs,ys=zip(*points)
  if max(xs)<region.bounds[0] or min(xs)>region.bounds[2] or max(ys)<region.bounds[1] or min(ys)>region.bounds[3]: return
  geometry=make_valid(shape(json.loads(factory.create_multipolygon(a)))).intersection(region)
  def collect(g):
   if g.is_empty:return
   if g.geom_type=='Polygon':self.polygons.append(mapping(g)['coordinates'])
   elif hasattr(g,'geoms'):
    for part in g.geoms:collect(part)
  collect(geometry);self.areas+=1
handler=Extract();handler.apply_file(str(args.source),locations=True,idx='flex_mem')
if not handler.polygons:raise SystemExit('No regional water polygons found')
data=dict(version=1,bounds=bounds,source='OpenStreetMap via Geofabrik Finland PBF',license='ODbL-1.0',attribution='© OpenStreetMap contributors',sourceFile=args.source.name,extractedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),polygons=handler.polygons)
args.output.parent.mkdir(parents=True,exist_ok=True)
with gzip.open(args.output,'wt') as f:json.dump(data,f,separators=(',',':'))
print(json.dumps(dict(areas=handler.areas,polygons=len(handler.polygons),output=str(args.output))))
