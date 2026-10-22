import clipping from 'polygon-clipping';
import type {Coordinate} from '@sporeward/protocol';
type Bounds=[number,number,number,number];
const boundsCache=new WeakMap<Coordinate[],Bounds>();
function bounds(ring:Coordinate[]):Bounds{
 let b=boundsCache.get(ring);if(!b){b=[Infinity,Infinity,-Infinity,-Infinity];for(const [x,y] of ring){b[0]=Math.min(b[0],x);b[1]=Math.min(b[1],y);b[2]=Math.max(b[2],x);b[3]=Math.max(b[3],y);}boundsCache.set(ring,b);}return b;
}
/** Only intersecting bounding boxes need polygon work. Do not merge neighbours.
 * An unrepresentable hole/complexity is rejected rather than filling over a neighbour. */
export function separatedContour(ring:Coordinate[],neighbours:Coordinate[][]):Coordinate[]|undefined{
 const a=bounds(ring),near=neighbours.filter(other=>{const b=bounds(other);return a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1];});
 if(!near.length)return ring;
 const result=clipping.difference([ring],...near.map(r=>[r]));
 const area=(r:Coordinate[])=>Math.abs(r.reduce((n,p,i)=>{const q=r[(i+1)%r.length];return n+(p[0]-r[0][0])*(q[1]-r[0][1])-(q[0]-r[0][0])*(p[1]-r[0][1]);},0));
 const candidates=result.filter(p=>p.length===1).map(p=>p[0].slice(0,-1) as Coordinate[]).filter(r=>r.length>=3&&r.length<=500);
 return candidates.sort((a,b)=>area(b)-area(a))[0];
}
