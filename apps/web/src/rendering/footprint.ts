import {tileCell,cellCorners} from './geography';
import clipping from 'polygon-clipping';
import {growthContours} from '@sporeward/rendering';
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
 const west=cx-r*1.7,north=cy-r*1.7,n=Math.ceil(r*3.4/step);
 const rings=growthContours(growth,step);
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
