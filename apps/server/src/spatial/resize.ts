import {cellKey,cellRing,neighbours,type AccessibleCell,type Cell} from './access.ts';
import type {SpatialOutbreak} from './generate.ts';
/** Geographic size follows authoritative effort; shrink one branch at a time.
 * Removing a cell must leave one connected, hole-free region. Growth never
 * claims another outbreak's cells and searches around occupied neighbours.
 */
export function resizeOutbreak(outbreak:SpatialOutbreak,size:number,access:AccessibleCell[],occupied:ReadonlySet<string>,heat:ReadonlyMap<string,number>=new Map()):SpatialOutbreak{
 if(!Number.isFinite(size)||size<=0)throw new Error('Positive geographic size required.');
 const wanted=Math.max(1,Math.ceil(size-1e-8)),available=new Set(access.map(cellKey));
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
  candidates.sort((a,b)=>(heat.get(cellKey(b))??0)-(heat.get(cellKey(a))??0)||rank(a)-rank(b));
  if(!candidates.length)break;const remove=cellKey(candidates[0]);cells=cells.filter(c=>cellKey(c)!==remove);
 }
 while(cells.length<wanted){
  const keys=new Set(cells.map(cellKey)),frontier=new Map<string,Cell>();
  for(const c of cells)for(const n of neighbours(c)){const key=cellKey(n);if(available.has(key)&&!keys.has(key)&&!occupied.has(key)&&connected([...cells,n]))frontier.set(key,n);}
  const candidates=[...frontier.values()].sort((a,b)=>rank(a)-rank(b));if(!candidates.length)break;cells.push(candidates[0]);
 }
 return {...outbreak,cells,ring:cellRing(cells)};
}
