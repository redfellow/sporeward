import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import clipping from 'polygon-clipping';
import type {Coordinate} from '@sporeward/protocol';
export type WaterPolygon=Coordinate[][];
let cached:WaterPolygon[]|undefined;
export function regionalWater():WaterPolygon[]{
 if(cached)return cached;
 const data=JSON.parse(gunzipSync(readFileSync(new URL('../../data/tampere-region-water.json.gz',import.meta.url))).toString('utf8'));
 if(data.version!==1||!Array.isArray(data.polygons)||!data.polygons.length)throw new Error('Invalid regional water snapshot.');
 return cached=data.polygons;
}
const indexed=new WeakMap<WaterPolygon[],{polygon:WaterPolygon;bounds:number[]}[]>();
function area(r:Coordinate[]){return Math.abs(r.reduce((sum,p,i)=>{const q=r[(i+1)%r.length];return sum+(p[0]-r[0][0])*(q[1]-r[0][1])-(q[0]-r[0][0])*(p[1]-r[0][1]);},0));}
/** Retain one land-connected, hole-free component. Never keep fragments across a lake.
 * A pond fully enclosed by the body is rejected, rather than painted over.
 * Small pre-tiled masks bound boolean work even beside a very large lake. */
export function landContour(ring:Coordinate[],water=regionalWater()):Coordinate[]|undefined{
 let index=indexed.get(water);if(!index){index=water.map(polygon=>({polygon,bounds:[Math.min(...polygon[0].map(p=>p[0])),Math.min(...polygon[0].map(p=>p[1])),Math.max(...polygon[0].map(p=>p[0])),Math.max(...polygon[0].map(p=>p[1]))]}));indexed.set(water,index);}
 const xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]),w=Math.min(...xs),s=Math.min(...ys),e=Math.max(...xs),n=Math.max(...ys);
 const nearby=index.filter(({bounds:b})=>w<b[2]&&e>b[0]&&s<b[3]&&n>b[1]);if(!nearby.length)return ring;
 const polygons=clipping.difference([ring],...nearby.map(p=>p.polygon));
 return polygons.filter(p=>p.length===1).map(p=>p[0].slice(0,-1) as Coordinate[]).filter(r=>r.length>=3&&r.length<=500).sort((a,b)=>area(b)-area(a))[0];
}
export class NoLandContour extends Error{constructor(){super('No connected accessible land contour.');}}
