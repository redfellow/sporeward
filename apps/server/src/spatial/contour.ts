import {landContour,NoLandContour} from './water.ts';
import {splashContour} from './splash.ts';
import {continuousContour} from './continuous.ts';
import type {Coordinate} from '@sporeward/protocol';
import {cellKey,tileCoordinate,type Cell} from './access.ts';
export type PartialCell={key:string;side:'west'|'east'|'north'|'south';fraction:number};
type Rectangle={west:number;east:number;north:number;south:number};
/** Validate the connected territory, including a fractional edge cell, then
 * derive its authoritative fluid silhouette from a seeded organic field. */
export function contour(cells:Cell[],partial?:PartialCell,seed='',version:3|4|5=4,surface?:Coordinate[]):Coordinate[]{
 const rectangles:Rectangle[]=[];
 for(const c of cells){
  const r={west:c.x,east:c.x+1,north:c.y,south:c.y+1};
  if(partial?.key===cellKey(c)){
   const f=partial.fraction;if(f<=0)continue;
   if(cells.length===1){const inset=(1-Math.sqrt(f))/2;r.west+=inset;r.east-=inset;r.north+=inset;r.south-=inset;}
   else if(partial.side==='west')r.east=r.west+f;
   else if(partial.side==='east')r.west=r.east-f;
   else if(partial.side==='north')r.south=r.north+f;
   else r.north=r.south-f;
  }
  rectangles.push(r);
 }
 if(!rectangles.length)throw new Error('Empty contour.');
 const xs=[...new Set(rectangles.flatMap(r=>[r.west,r.east]))].sort((a,b)=>a-b),ys=[...new Set(rectangles.flatMap(r=>[r.north,r.south]))].sort((a,b)=>a-b);
 const edges=new Map<string,[Coordinate,Coordinate]>(),key=(p:Coordinate)=>p.join(',');
 for(let x=0;x<xs.length-1;x++)for(let y=0;y<ys.length-1;y++){
  const mx=(xs[x]+xs[x+1])/2,my=(ys[y]+ys[y+1])/2;
  if(!rectangles.some(r=>mx>r.west&&mx<r.east&&my>r.north&&my<r.south))continue;
  const corners:Coordinate[]=[[xs[x],ys[y]],[xs[x+1],ys[y]],[xs[x+1],ys[y+1]],[xs[x],ys[y+1]]];
  for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4],reverse=key(b)+'>'+key(a);if(edges.has(reverse))edges.delete(reverse);else edges.set(key(a)+'>'+key(b),[a,b]);}
 }
 const chain=new Map([...edges.values()].map(([a,b])=>[key(a),b])),first=[...edges.values()][0][0];let cursor=first,ring:Coordinate[]=[];
 do{ring.push(cursor);const next=chain.get(key(cursor));if(!next||ring.length>edges.size)throw new Error('Invalid contour boundary.');cursor=next;}while(key(cursor)!==key(first));
 if(ring.length!==edges.size)throw new Error('Contour has a hole or disconnected parts.');
 const splash=version===3?splashContour(rectangles,seed):continuousContour(rectangles,seed,surface);
 if(!splash)throw new Error('No connected splash contour.');
 const geographic=splash.map(tileCoordinate);
 if(version!==5)return geographic;
 const land=landContour(geographic);if(!land)throw new NoLandContour();return land;
}
