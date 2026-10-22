import {growthField} from '@sporeward/rendering';
import type {Coordinate} from '@sporeward/protocol';
type Rectangle={west:number;east:number;north:number;south:number};
const canonicalCache=new Map<string,Coordinate[]>();
/** Cache the expensive seeded surface once. Growth/shrink only scales its outline. */
export function canonicalContour(identity:string):Coordinate[]|undefined{
 const cached=canonicalCache.get(identity);if(cached){canonicalCache.delete(identity);canonicalCache.set(identity,cached);return cached;}
 let seed=2166136261;for(const c of identity)seed=Math.imul(seed^c.charCodeAt(0),16777619);
 const field=growthField({center:[0,0],radius:150,seed:seed>>>0});
 const step=3,west=-255,north=-255,nx=170,ny=170;
 const values=Array.from({length:ny+1},(_,y)=>Array.from({length:nx+1},(_,x)=>field(west+x*step,north+y*step)));
 const points=new Map<string,Coordinate>(),links=new Map<string,string[]>();
 const connect=(a:string,b:string)=>{links.set(a,[...(links.get(a)??[]),b]);links.set(b,[...(links.get(b)??[]),a]);};
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
  const corners:Coordinate[]=[[west+x*step,north+y*step],[west+(x+1)*step,north+y*step],[west+(x+1)*step,north+(y+1)*step],[west+x*step,north+(y+1)*step]],v=[values[y][x],values[y][x+1],values[y+1][x+1],values[y+1][x]],keys=[`h${x},${y}`,`v${x+1},${y}`,`h${x},${y+1}`,`v${x},${y}`],edges:number[]=[];
  for(let e=0;e<4;e++){const next=(e+1)%4;if((v[e]>0)===(v[next]>0))continue;edges.push(e);if(!points.has(keys[e])){const t=v[e]/(v[e]-v[next]),a=corners[e],b=corners[next];points.set(keys[e],[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}
  if(edges.length===2)connect(keys[edges[0]],keys[edges[1]]);
  else if(edges.length===4){if((v.reduce((a,b)=>a+b,0)>0)===(v[0]>0)){connect(keys[0],keys[1]);connect(keys[2],keys[3]);}else{connect(keys[3],keys[0]);connect(keys[1],keys[2]);}}
 }
 const seen=new Set<string>(),loops:Coordinate[][]=[];
 for(const first of links.keys()){
  if(seen.has(first))continue;let cursor=first,previous='';const ring:Coordinate[]=[];
  while(!seen.has(cursor)){seen.add(cursor);ring.push(points.get(cursor)!);const next=(links.get(cursor)??[]).find(k=>k!==previous);if(!next)break;previous=cursor;cursor=next;}
  if(cursor===first&&ring.length>=3)loops.push(ring);
 }
 const ringArea=(r:Coordinate[])=>Math.abs(r.reduce((n,a,i)=>{const b=r[(i+1)%r.length];return n+(a[0]-r[0][0])*(b[1]-r[0][1])-(b[0]-r[0][0])*(a[1]-r[0][1]);},0));
 let ring=loops.sort((a,b)=>ringArea(b)-ringArea(a))[0];
 if(!ring)return;
 // Error-bounded simplification retains rounded lip detail within the protocol cap.
 const simplify=(points:Coordinate[],tolerance:number):Coordinate[]=>{
  const a=points[0],b=points.at(-1)!,dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;let maximum=0,index=0;
  for(let i=1;i<points.length-1;i++){const p=points[i],t=length?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)):0,d=(p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2;if(d>maximum){maximum=d;index=i;}}
  if(maximum<=tolerance*tolerance)return [a,b];
  return [...simplify(points.slice(0,index+1),tolerance).slice(0,-1),...simplify(points.slice(index),tolerance)];
 };
 const raw=ring,half=Math.floor(raw.length/2);let tolerance=.65;
 do{ring=[...simplify(raw.slice(0,half+1),tolerance).slice(0,-1),...simplify([...raw.slice(half),raw[0]],tolerance).slice(0,-1)];tolerance*=1.3;}while(ring.length>480);
 canonicalCache.set(identity,ring);if(canonicalCache.size>1024)canonicalCache.delete(canonicalCache.keys().next().value!);
 return ring;
}
/** One continuous body sized by territory; cell centres never seed its lobes. */
export function continuousContour(rectangles:Rectangle[],identity:string,surface?:Coordinate[]):Coordinate[]|undefined{
 if(!rectangles.length)return;
 const ring=surface??canonicalContour(identity);if(!ring)return;
 const left=Math.min(...rectangles.map(r=>r.west)),right=Math.max(...rectangles.map(r=>r.east)),top=Math.min(...rectangles.map(r=>r.north)),bottom=Math.max(...rectangles.map(r=>r.south));
 const area=rectangles.reduce((n,r)=>n+(r.east-r.west)*(r.south-r.north),0),radius=Math.sqrt(area)*.65,cx=(left+right)/2,cy=(top+bottom)/2,stretch=Math.sqrt(Math.min(3,Math.max(1/3,(right-left)/(bottom-top))));
 return ring.map(([x,y])=>[cx+x/150*radius*stretch,cy+y/150*radius/stretch]);
}
