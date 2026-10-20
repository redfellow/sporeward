import type {Coordinate} from '@sporeward/protocol';
type Rect={west:number;east:number;north:number;south:number};
/** Seeded metaball field: the grid allocates territory; it does not draw its edge. */
export function splashContour(rectangles:Rect[],seed:string):Coordinate[]|undefined {
 const hash=(text:string)=>{let h=2166136261;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)/4294967296;};
 const phase=hash(seed)*Math.PI*2;
 const masses=rectangles.map(r=>{const w=r.east-r.west,h=r.south-r.north,k=seed+':'+Math.floor(r.west)+','+Math.floor(r.north),j=hash(k),scale=(rectangles.length===1?.42:.39+.14*hash(k+'s'));return {x:(r.west+r.east)/2+(j-.5)*.30*w,y:(r.north+r.south)/2+(hash(k+'y')-.5)*.30*h,sx:w*scale,sy:h*scale,small:Math.min(w,h)};});
 const bridges:{a:typeof masses[number];b:typeof masses[number];cx:number;cy:number;radius:number}[]=[];
 for(let i=0;i<masses.length;i++)for(let j=i+1;j<masses.length;j++){
  const r=rectangles[i],s=rectangles[j];if(Math.abs(Math.floor(r.west)-Math.floor(s.west))+Math.abs(Math.floor(r.north)-Math.floor(s.north))!==1)continue;
  const a=masses[i],b=masses[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),bend=(hash(seed+':bridge:'+i+':'+j)-.5)*.35;
  bridges.push({a,b,cx:(a.x+b.x)/2-dy/d*bend,cy:(a.y+b.y)/2+dx/d*bend,radius:(.17+.08*hash(seed+':neck:'+i+':'+j))*Math.sqrt(Math.min(a.small,b.small))});
 }
 const field=(x:number,y:number)=>{
  let v=0;for(const m of masses)v=Math.max(v,Math.exp(-(((x-m.x)/m.sx)**2+((y-m.y)/m.sy)**2)));
  for(const {a,b,cx,cy,radius} of bridges){
   let distance=Infinity;
   for(const [ax,ay,bx,by] of [[a.x,a.y,cx,cy],[cx,cy,b.x,b.y]]){const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));distance=Math.min(distance,Math.hypot(x-ax-t*dx,y-ay-t*dy));}
   v=Math.max(v,.9*Math.exp(-((distance/radius)**2)));
  }
  return v-(.55+.075*Math.sin(x*8.1+phase)*Math.cos(y*7.3-phase)+.035*Math.sin(x*14.7+y*5.9+phase));
 };
 const step=.09,west=Math.min(...rectangles.map(r=>r.west))-.5,north=Math.min(...rectangles.map(r=>r.north))-.5,nx=Math.ceil((Math.max(...rectangles.map(r=>r.east))+.5-west)/step),ny=Math.ceil((Math.max(...rectangles.map(r=>r.south))+.5-north)/step);
 const values=Array.from({length:ny+1},(_,y)=>Array.from({length:nx+1},(_,x)=>field(west+x*step,north+y*step)));
 const points=new Map<string,Coordinate>(),links=new Map<string,string[]>();
 const connect=(a:string,b:string)=>{links.set(a,[...(links.get(a)??[]),b]);links.set(b,[...(links.get(b)??[]),a]);};
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
  const corners:Coordinate[]=[[west+x*step,north+y*step],[west+(x+1)*step,north+y*step],[west+(x+1)*step,north+(y+1)*step],[west+x*step,north+(y+1)*step]],v=[values[y][x],values[y][x+1],values[y+1][x+1],values[y+1][x]],keys=[`h${x},${y}`,`v${x+1},${y}`,`h${x},${y+1}`,`v${x},${y}`],edges:number[]=[];
  for(let e=0;e<4;e++){const next=(e+1)%4;if((v[e]>0)===(v[next]>0))continue;edges.push(e);if(!points.has(keys[e])){const t=v[e]/(v[e]-v[next]),a=corners[e],b=corners[next];points.set(keys[e],[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}
  if(edges.length===2)connect(keys[edges[0]],keys[edges[1]]);
  else if(edges.length===4){const middle=field(west+(x+.5)*step,north+(y+.5)*step)>0;if((v[0]>0)===middle){connect(keys[0],keys[1]);connect(keys[2],keys[3]);}else{connect(keys[3],keys[0]);connect(keys[1],keys[2]);}}
 }
 const seen=new Set<string>(),loops:Coordinate[][]=[];
 for(const first of links.keys()){
  if(seen.has(first))continue;let cursor=first,previous='',ring:Coordinate[]=[];
  while(!seen.has(cursor)){seen.add(cursor);ring.push(points.get(cursor)!);const next=(links.get(cursor)??[]).find(k=>k!==previous);if(!next)break;previous=cursor;cursor=next;}
  if(cursor===first&&ring.length>=3)loops.push(ring);
 }
 const area=(r:Coordinate[])=>Math.abs(r.reduce((n,a,i)=>{const b=r[(i+1)%r.length];return n+(a[0]-r[0][0])*(b[1]-r[0][1])-(b[0]-r[0][0])*(a[1]-r[0][1]);},0));
 let ring=loops.sort((a,b)=>area(b)-area(a))[0];if(!ring)return;
 if(ring.length>220)ring=Array.from({length:220},(_,i)=>ring[Math.floor(i/220*ring.length)]);
 return ring.flatMap((a,i)=>{const b=ring[(i+1)%ring.length];return [[a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]] as Coordinate[];});
}
