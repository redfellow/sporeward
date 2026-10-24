import type {WorldView,Coordinate} from '@sporeward/protocol';
import type {MapViewport} from './RicherOverlay';
type Outbreak=WorldView['outbreaks'][number];
export function overviewBounds(world:WorldView|null,fallback:[number,number,number,number]|null):[number,number,number,number]|null{
 let west=Infinity,south=Infinity,east=-Infinity,north=-Infinity;
 const include=([longitude,latitude]:Coordinate)=>{west=Math.min(west,longitude);south=Math.min(south,latitude);east=Math.max(east,longitude);north=Math.max(north,latitude);};
 for(const outbreak of world?.outbreaks??[])for(const point of outbreak.ring)include(point);
 for(const lab of world?.fieldLabs??[])include(lab.position);
 const zone=world?.resistance;
 if(zone?.centre&&zone.centreResistance>0){
  const [longitude,latitude]=zone.centre,dy=zone.radiusMetres/111320,dx=dy/Math.cos(latitude*Math.PI/180);
  include([longitude-dx,latitude-dy]);include([longitude+dx,latitude+dy]);
 }
 return Number.isFinite(west)?[west,south,east,north]:fallback;
}
export function outbreakPreparationIndex(outbreaks:Outbreak[]){
 return outbreaks.map(outbreak=>{
  const xs=outbreak.ring.map(p=>p[0]),ys=outbreak.ring.map(p=>p[1]);
  return {outbreak,west:Math.min(...xs),east:Math.max(...xs),south:Math.min(...ys),north:Math.max(...ys)};
 });
}
/** Visible bodies first, then a half-screen preparation margin, with stable ties. */
export function selectPreparedOutbreaks(index:ReturnType<typeof outbreakPreparationIndex>,viewport:MapViewport,limit=24){
 const [west,south,east,north]=viewport.bounds,dx=Math.max(east-west,1e-8),dy=Math.max(north-south,1e-8);
 const intersects=(o:typeof index[number],margin:number)=>o.east>=west-dx*margin&&o.west<=east+dx*margin&&o.north>=south-dy*margin&&o.south<=north+dy*margin;
 return index.filter(o=>intersects(o,.5)).map(o=>({outbreak:o.outbreak,visible:intersects(o,0),distance:Math.hypot(((o.west+o.east)/2-viewport.center[0])/dx,((o.south+o.north)/2-viewport.center[1])/dy)})).sort((a,b)=>Number(b.visible)-Number(a.visible)||a.distance-b.distance||a.outbreak.id.localeCompare(b.outbreak.id)).slice(0,limit);
}
