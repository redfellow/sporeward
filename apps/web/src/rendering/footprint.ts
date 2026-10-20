import {tileCell,cellCorners} from './geography';
import clipping from 'polygon-clipping';
import {growthField} from './growth-field';
/** Prototype geometry in local geographic metres. Cells never determine the outline. */
export type Point = [number, number];
export type Footprint = { rings: Point[][]; polygons: Point[][][]; cells: Point[]; seed: number };
export type Growth = { center: Point; radius: number; seed: number };
export function random(seed: number) {
 return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function insideRing(p: Point, ring: Point[]): boolean {
 let inside = false;
 for (let i=0,j=ring.length-1;i<ring.length;j=i++) {
  const a=ring[i],b=ring[j];
  if ((a[1]>p[1]) !== (b[1]>p[1]) && p[0] < (b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
 }
 return inside;
}
/** Same even-odd geometry consumed by the renderer and contact queries, including holes. */
export function contact(p: Point, footprint: Footprint): boolean {
 return footprint.rings.reduce((hit, ring)=>insideRing(p,ring)!==hit,false);
}
export function makeFootprint(growth: Growth, water: Point[][][], step=2, blockers:Point[][][]=[]): Footprint {
 const {center:[cx,cy],radius:r,seed}=growth;
 const field=growthField(growth);
 const west=cx-r*1.7,north=cy-r*1.7,n=Math.ceil(r*3.4/step);
 const values=Array.from({length:n+1},(_,y)=>Array.from({length:n+1},(_,x)=>field(west+x*step,north+y*step)));
 const vertices=new Map<string,Point>(),links=new Map<string,string[]>();
 const connect=(a:string,b:string)=>{links.set(a,[...(links.get(a)??[]),b]);links.set(b,[...(links.get(b)??[]),a]);};
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const v=[values[y][x],values[y][x+1],values[y+1][x+1],values[y+1][x]],p:Point[]=[[west+x*step,north+y*step],[west+(x+1)*step,north+y*step],[west+(x+1)*step,north+(y+1)*step],[west+x*step,north+(y+1)*step]],keys=[`h${x},${y}`,`v${x+1},${y}`,`h${x},${y+1}`,`v${x},${y}`],edges:number[]=[];
  for(let e=0;e<4;e++){const j=(e+1)%4;if((v[e]>0)===(v[j]>0))continue;edges.push(e);const t=v[e]/(v[e]-v[j]);vertices.set(keys[e],[p[e][0]+t*(p[j][0]-p[e][0]),p[e][1]+t*(p[j][1]-p[e][1])]);}
  if(edges.length===2)connect(keys[edges[0]],keys[edges[1]]);
  else if(edges.length===4){if((v.reduce((a,b)=>a+b,0)>0) === (v[0]>0)){connect(keys[0],keys[1]);connect(keys[2],keys[3]);}else{connect(keys[0],keys[3]);connect(keys[1],keys[2]);}}
 }
 const visited=new Set<string>(),rings:Point[][]=[];
 for(const start of links.keys()){
  if(visited.has(start))continue;
  let current=start,previous='';const ring:Point[]=[];
  while(!visited.has(current)){visited.add(current);ring.push(vertices.get(current)!);const next=links.get(current)?.find(k=>k!==previous);if(!next)break;previous=current;current=next;}
  if(current===start&&ring.length>3)rings.push(ring);
 }
 // Boolean subtraction retains the original mapped shoreline exactly, including islands.
 // Treat marching loops with even-odd fill, then subtract complete water polygons.
 const raw=rings.length?clipping.xor(...rings.map(ring=>[ring]) as [Point[][],...Point[][][]]):[];
 const constraints=[...water,...blockers];
 const polygons=raw.length&&constraints.length?clipping.difference(raw,constraints):raw;
 const clippedRings=polygons.flat() as Point[][];
 const footprint:Footprint={rings:clippedRings,polygons,cells:[],seed};
 // Conservative bookkeeping candidates. Exact contact always uses rings, never these cells.
 const [minX,minY]=tileCell([west,north]),[maxX,maxY]=tileCell([west+n*step,north+n*step]);
 for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
  const corners=cellCorners([x,y]);
  if(polygons.length && clipping.intersection(polygons,[corners]).length)footprint.cells.push([x,y]);
 }
 return footprint;
}
