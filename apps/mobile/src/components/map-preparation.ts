import type {WorldView} from '@sporeward/protocol';
import type {MapViewport} from './RicherOverlay';
type Outbreak=WorldView['outbreaks'][number];
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
