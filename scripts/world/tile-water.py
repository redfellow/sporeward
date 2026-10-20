#!/usr/bin/env python3
"""Split a water snapshot into small geographic pieces for bounded contour clipping."""
import gzip,json,math,argparse
from pathlib import Path
from shapely.geometry import Polygon,box,mapping
p=argparse.ArgumentParser();p.add_argument('path',type=Path);a=p.parse_args()
with gzip.open(a.path,'rt') as f:data=json.load(f)
if data.get('tiled'):raise SystemExit('Already tiled')
result=[]
def collect(g):
 if g.is_empty:return
 if g.geom_type=='Polygon':result.append(mapping(g)['coordinates'])
 elif hasattr(g,'geoms'):
  for part in g.geoms:collect(part)
for rings in data['polygons']:
 poly=Polygon(rings[0],rings[1:]);w,s,e,n=poly.bounds
 for x in range(math.floor(w/.01),math.floor(e/.01)+1):
  for y in range(math.floor(s/.005),math.floor(n/.005)+1):collect(poly.intersection(box(x*.01,y*.005,(x+1)*.01,(y+1)*.005)))
data.update(polygons=result,tiled=True)
temporary=a.path.with_suffix('.tmp')
with gzip.open(temporary,'wt') as f:json.dump(data,f,separators=(',',':'))
temporary.replace(a.path)
print(json.dumps(dict(pieces=len(result),bytes=a.path.stat().st_size)))
