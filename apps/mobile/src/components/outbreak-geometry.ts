import {guideCrackedRings,guideClearingRing,guideSplittingPaths,sampleShape,smoothShape,remnantShapeRings,clipGuideRings,identitySeed} from '@sporeward/rendering';
import type {WorldView,Coordinate} from '@sporeward/protocol';
import {growthPoint,growthCoordinate,type Point} from './map-coordinates';
type Outbreak=WorldView['outbreaks'][number];
/** Display geometry only; authoritative server contact rings are never rewritten. */
function buildOutbreakGeometry(o:Outbreak,world:WorldView|null){
 let siblings=[o],side=-1,seed=identitySeed(o.id)%10000;
 if(o.lifecycle==='stabilizing'){
  const example=world?.renderTest?.examples.find(e=>e.ids.length===2&&e.ids.includes(o.id));
  const parent=o.id.replace(/ · (Left|Right)$/,'');
  siblings=(world?.outbreaks??[o]).filter(other=>example?example.ids.includes(other.id):other.lifecycle==='stabilizing'&&other.id.replace(/ · (Left|Right)$/,'')===parent).sort((a,b)=>example?example.ids.indexOf(a.id)-example.ids.indexOf(b.id):a.id.localeCompare(b.id));
  if(siblings.length===2){side=siblings.findIndex(s=>s.id===o.id);seed=identitySeed(siblings.map(s=>s.id).join('|'))%10000;}
 }
 const original=siblings.flatMap(s=>s.ring.map(growthPoint)),xs=original.map(p=>p[0]),ys=original.map(p=>p[1]),west=Math.min(...xs),east=Math.max(...xs),north=Math.min(...ys),south=Math.max(...ys),center:Point=[(west+east)/2,(north+south)/2];
 let local:Point[][]|null=null,scale=Math.min(east-west,south-north)/220;
 if(o.lifecycle==='remnant'){local=remnantShapeRings(seed);scale=Math.min(east-west,south-north)/170;}
 else if(o.status==='clearing'){local=[smoothShape(guideClearingRing(80,seed))];scale=Math.min(east-west,south-north)/180;}
 else if(side>=0){local=[sampleShape(guideSplittingPaths(seed)[side])];scale=Math.min(east-west,south-north)/200;}
 let rings:Coordinate[][]=local?local.map(ring=>ring.map(([x,y])=>growthCoordinate([center[0]+x*scale,center[1]+y*scale]))):[o.ring];
 if(local){const clipped=clipGuideRings(rings,siblings.map(s=>s.ring));rings=clipped.length?clipped:[o.ring];}
 if(!local&&(o.crossings??0)>=3)rings=guideCrackedRings(rings.map(ring=>ring.map(growthPoint))).map(ring=>ring.map(growthCoordinate));
 const materialRadius=local?77*scale:Math.max(east-west,south-north)/2.3;
 return {rings,center,materialRadius,seed,special:!!local,splitSide:side,anchor:growthCoordinate(local&&side>=0?[center[0]+(side===0?-40:40)*scale,center[1]]:center)};
}

const geometryCache=new WeakMap<WorldView,Map<string,ReturnType<typeof buildOutbreakGeometry>>>();
export function outbreakGeometry(o:Outbreak,world:WorldView|null){
 if(!world)return buildOutbreakGeometry(o,world);
 let entries=geometryCache.get(world);if(!entries){entries=new Map();geometryCache.set(world,entries);}
 const cached=entries.get(o.id);if(cached)return cached;
 const geometry=buildOutbreakGeometry(o,world);entries.set(o.id,geometry);return geometry;
}
export function outbreakAnchor(o:Outbreak,world:WorldView|null):Coordinate{
 if(o.lifecycle==='stabilizing')return outbreakGeometry(o,world).anchor;
 const points=o.ring.map(growthPoint),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 return growthCoordinate([(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2]);
}

/** A splitting pair is one visual destination until stabilization completes. */
export function outbreakMarkers(world:WorldView|null){
 return (world?.outbreaks??[]).flatMap(o=>{
  if(o.lifecycle!=='stabilizing')return [{outbreak:o,anchor:outbreakAnchor(o,world),members:[o]}];
  const geometry=outbreakGeometry(o,world);
  if(geometry.splitSide===1)return [];
  const example=world?.renderTest?.examples.find(e=>e.ids.length===2&&e.ids.includes(o.id));
  const parent=o.id.replace(/ · (Left|Right)$/,'');
  const members=geometry.splitSide===0?(world?.outbreaks??[o]).filter(other=>example?example.ids.includes(other.id):other.lifecycle==='stabilizing'&&other.id.replace(/ · (Left|Right)$/,'')===parent):[o];
  return [{outbreak:o,anchor:geometry.splitSide===0?growthCoordinate(geometry.center):geometry.anchor,members}];
 });
}
