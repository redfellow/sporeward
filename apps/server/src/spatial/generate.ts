import {contour,type PartialCell} from './contour.ts';
import type {Coordinate} from '@sporeward/protocol';
import {cellKey,neighbours,type AccessibleCell,type Cell} from './access.ts';
export type SpatialOutbreak={id:string;name:string;cells:Cell[];ring:Coordinate[];accessWay:number;partial?:PartialCell};
export function generateOutbreaks(access:AccessibleCell[],seed=73,count=20,blocked:ReadonlySet<string>=new Set()):SpatialOutbreak[]{
 if(!Number.isSafeInteger(count)||count<1||count>25||!Number.isInteger(seed))throw new Error('Invalid spawn settings.');
 let rng=seed>>>0;const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
 const available=new Map(access.map(c=>[cellKey(c),c])),occupied=new Set<string>(blocked),result:SpatialOutbreak[]=[];
 const candidates=[...access].sort((a,b)=>a.x-b.x||a.y-b.y);
 for(let i=candidates.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
 for(const anchor of candidates){
  if(occupied.has(cellKey(anchor))||neighbours(anchor).some(c=>occupied.has(cellKey(c))))continue;
  const cells:Cell[]=[{x:anchor.x,y:anchor.y}],chosen=new Set([cellKey(anchor)]);
  while(cells.length<5){
   const frontier=new Map<string,Cell>();for(const c of cells)for(const next of neighbours(c)){
    const key=cellKey(next);if(available.has(key)&&!chosen.has(key)&&!occupied.has(key)&&!neighbours(next).some(n=>occupied.has(cellKey(n))))frontier.set(key,next);
   }
   const options=[...frontier.values()];if(!options.length)break;
   const next=options[Math.floor(random()*options.length)];cells.push(next);chosen.add(cellKey(next));
  }
  if(cells.length!==5)continue;
  result.push({id:`tampere-${seed}-${result.length+1}`,name:`Tampere ${String(result.length+1).padStart(2,'0')}`,cells,ring:contour(cells,undefined,`tampere-${seed}-${result.length+1}`),accessWay:anchor.ways[0]});
  for(const c of cells)occupied.add(cellKey(c));if(result.length===count)break;
 }
 if(result.length!==count)throw new Error(`Accessible map supports only ${result.length} separated five-cell outbreaks; requested ${count}.`);
 return result;
}
