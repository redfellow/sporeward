import {NoLandContour} from './water.ts';
import {contour,type PartialCell} from './contour.ts';
import {canonicalContour} from './continuous.ts';
import {cellKey,cellRing,neighbours,type AccessibleCell,type Cell} from './access.ts';
import type {SpatialOutbreak} from './generate.ts';
const accessIndexes=new WeakMap<AccessibleCell[],Set<string>>();
/** Geographic size follows authoritative effort; shrink one branch at a time.
 * Removing a cell must leave one connected, hole-free region. Growth never
 * claims another outbreak's cells and searches around occupied neighbours.
 */
export function resizeOutbreak(outbreak:SpatialOutbreak,size:number,access:AccessibleCell[],occupied:ReadonlySet<string>,heat:ReadonlyMap<string,number>=new Map(),version:3|4|5=4):SpatialOutbreak{
 if(!Number.isFinite(size)||size<=0)throw new Error('Positive geographic size required.');
 const wanted=Math.max(1,Math.ceil(size-1e-8));
 let available=accessIndexes.get(access);if(!available){available=new Set(access.map(cellKey));accessIndexes.set(access,available);}
 let cells=outbreak.cells.map(c=>({...c}));
 const connected=(remaining:Cell[])=>{
  if(!remaining.length)return false;const keys=new Set(remaining.map(cellKey)),seen=new Set<string>(),queue=[remaining[0]];
  while(queue.length){const c=queue.pop()!,key=cellKey(c);if(seen.has(key))continue;seen.add(key);for(const n of neighbours(c))if(keys.has(cellKey(n))&&!seen.has(cellKey(n)))queue.push(n);}
  if(seen.size!==remaining.length)return false;
  try{cellRing(remaining);return true;}catch{return false;}
 };
 const rank=(c:Cell)=>{let h=2166136261;for(const char of outbreak.id+':'+cellKey(c))h=Math.imul(h^char.charCodeAt(0),16777619);return h>>>0;};
 while(cells.length>wanted){
  const candidates=cells.filter(c=>connected(cells.filter(other=>cellKey(other)!==cellKey(c))));
  candidates.sort((a,b)=>(cellKey(a)===outbreak.partial?.key?-1:cellKey(b)===outbreak.partial?.key?1:0)||(heat.get(cellKey(b))??0)-(heat.get(cellKey(a))??0)||rank(a)-rank(b));
  if(!candidates.length)break;const remove=cellKey(candidates[0]);cells=cells.filter(c=>cellKey(c)!==remove);
 }
 while(cells.length<wanted){
  const keys=new Set(cells.map(cellKey)),frontier=new Map<string,Cell>();
  for(const c of cells)for(const n of neighbours(c)){const key=cellKey(n);if(available.has(key)&&!keys.has(key)&&!occupied.has(key)&&!neighbours(n).some(c=>occupied.has(cellKey(c)))&&connected([...cells,n]))frontier.set(key,n);}
  const candidates=[...frontier.values()].sort((a,b)=>rank(a)-rank(b));if(!candidates.length)break;cells.push(candidates[0]);
 }
 const fraction=Math.min(1,Math.max(cells.length===1?1/32:0,Math.round((size-(cells.length-1))*32)/32));
 let partial:PartialCell|undefined;
 if(fraction<1){
  const candidates=cells.filter(c=>cells.length===1||connected(cells.filter(other=>cellKey(other)!==cellKey(c))));
  candidates.sort((a,b)=>(cellKey(a)===outbreak.partial?.key?-1:cellKey(b)===outbreak.partial?.key?1:0)||(heat.get(cellKey(b))??0)-(heat.get(cellKey(a))??0)||rank(a)-rank(b));
  const c=candidates.find(c=>cellKey(c)===cellKey(cells[cells.length-1])&&cells.length>outbreak.cells.length)??candidates[0];
  if(c){
   const full=new Set(cells.filter(other=>cellKey(other)!==cellKey(c)).map(cellKey));
   const sides=[['west',{x:c.x-1,y:c.y}],['east',{x:c.x+1,y:c.y}],['north',{x:c.x,y:c.y-1}],['south',{x:c.x,y:c.y+1}]] as const;
   const side=outbreak.partial?.key===cellKey(c)?outbreak.partial.side:sides.find(([,n])=>full.has(cellKey(n)))?.[0]??'west';
   partial={key:cellKey(c),side,fraction};
  }
 }
 const surface=version>=4?outbreak.surface??canonicalContour(outbreak.id):undefined;
 try{return {...outbreak,cells,partial,...(surface?{surface}:{}),ring:contour(cells,partial,outbreak.id,version,surface)};}catch(e){if(e instanceof NoLandContour)return outbreak;throw e;}
}
