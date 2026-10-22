/** Procedural state silhouettes from the accepted guide, in local drawing units. */
import polygonClipping from 'polygon-clipping';
export type ShapePoint=[number,number];
/** Keep decorative state contours inside authoritative land/contact footprints. */
export function clipGuideRings(rings:ShapePoint[][],footprints:ShapePoint[][]):ShapePoint[][]{
 const [first,...rest]=footprints.map(r=>[r] as polygonClipping.Polygon);if(!first)return [];
 const land=polygonClipping.union(first,...rest);
 return rings.flatMap(ring=>polygonClipping.intersection([ring],land).filter(p=>p.length===1).map(p=>{const ring=p[0] as ShapePoint[],a=ring[0],b=ring.at(-1)!;return a[0]===b[0]&&a[1]===b[1]?ring.slice(0,-1):ring;}));
}
export function guideRoundedRing(radius:number,seed:number):ShapePoint[]{return Array.from({length:64},(_,i)=>{const a=i/64*Math.PI*2,r=radius*(1+.065*Math.sin(a*3+seed)+.035*Math.cos(a*5-seed));return [Math.cos(a)*r,Math.sin(a)*r];});}
export function guideClearingRing(radius:number,seed:number,amount=.15):ShapePoint[]{return Array.from({length:96},(_,i)=>{const a=i/96*Math.PI*2,r=radius*(1+amount*(.65*Math.sin(a*3+seed)+.35*Math.cos(a*5-seed)+.2*Math.sin(a*7+seed*.7)));return [Math.cos(a)*r,Math.sin(a)*r];});}
export type ShapeCommand={op:'move'|'line';point:ShapePoint}|{op:'quad';control:ShapePoint;point:ShapePoint}|{op:'close'};
export function guideSplittingPaths(seed:number):ShapeCommand[][]{
 const radius=(a:number)=>74*(1+.20*Math.sin(a*3+seed)+.12*Math.cos(a*5-seed)+.065*Math.sin(a*7+seed*.7)),top=-radius(-Math.PI/2),bottom=radius(Math.PI/2);
 return [-1,1].map(side=>{
  const points:ShapePoint[]=[],start=side===1?-Math.PI/2:Math.PI/2;
  for(let i=0;i<=48;i++){const a=start+i/48*Math.PI,r=radius(a);points.push([side*4+Math.cos(a)*r,Math.sin(a)*r]);}
  const path:ShapeCommand[]=[{op:'move',point:points[0]}];
  for(let i=1;i<points.length-1;i++){const next=points[i+1];path.push({op:'quad',control:points[i],point:[(points[i][0]+next[0])/2,(points[i][1]+next[1])/2]});}
  path.push({op:'line',point:points[points.length-1]});
  for(let i=0;i<=24;i++){const t=i/24,y=side===1?bottom+(top-bottom)*t:top+(bottom-top)*t,u=(y-top)/(bottom-top);path.push({op:'line',point:[side*4+7*Math.sin(u*Math.PI*12)*Math.sin(u*Math.PI),y]});}
  path.push({op:'close'});return path;
 });
}
export function sampleShape(path:ShapeCommand[]):ShapePoint[]{
 const points:ShapePoint[]=[];let previous:ShapePoint=[0,0];
 for(const c of path){if(c.op==='move'||c.op==='line'){points.push(c.point);previous=c.point;}else if(c.op==='quad'){const a=previous;for(let i=1;i<=4;i++){const t=i/4,u=1-t;points.push([u*u*a[0]+2*u*t*c.control[0]+t*t*c.point[0],u*u*a[1]+2*u*t*c.control[1]+t*t*c.point[1]]);}previous=c.point;}}
 return points;
}
export function smoothShape(points:ShapePoint[]):ShapePoint[]{
 const last=points.at(-1)!,first:ShapePoint=[(last[0]+points[0][0])/2,(last[1]+points[0][1])/2];
 return sampleShape([{op:'move',point:first},...points.map((p,i):ShapeCommand=>{const n=points[(i+1)%points.length];return {op:'quad',control:p,point:[(p[0]+n[0])/2,(p[1]+n[1])/2]};}),{op:'close'}]);
}
export function guideRemnantDroplets(){return Array.from({length:15},(_,i)=>{const angle=i/15*Math.PI*2,r=86+(i%3)*9,small=3+(i*7%6);return {x:Math.cos(angle)*r,y:Math.sin(angle)*r,rx:small,ry:small*.8,angle};});}
export function remnantShapeRings(seed:number):ShapePoint[][]{
 return [smoothShape(guideRoundedRing(69,seed)),...guideRemnantDroplets().map(d=>Array.from({length:20},(_,i):ShapePoint=>{const a=i/20*Math.PI*2;return [d.x+Math.cos(a)*d.rx*Math.cos(d.angle)-Math.sin(a)*d.ry*Math.sin(d.angle),d.y+Math.cos(a)*d.rx*Math.sin(d.angle)+Math.sin(a)*d.ry*Math.cos(d.angle)];}))];
}

/** Original angular fissure recipe: an edge-to-edge trunk with tapering side forks. */
export function guideCrackedRings(rings:ShapePoint[][]):ShapePoint[][]{
 const points=rings.flat();if(!points.length)return [];
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),west=Math.min(...xs),east=Math.max(...xs),north=Math.min(...ys),south=Math.max(...ys),width=east-west,height=south-north;
 if(!width||!height)return rings;
 const ribbon=(points:ShapePoint[],widths:number[]):polygonClipping.Polygon=>{
  const edges=[1,-1].map(side=>points.map((p,i):ShapePoint=>{
   const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;
   return [(west+east)/2+(p[0]-side*dy/length*widths[i])*width,(north+south)/2+(p[1]+side*dx/length*widths[i])*height];
  }));
  return [[...edges[0],...edges[1].reverse()]];
 };
 const trunk=ribbon([[-.75,.35],[-.38,.20],[-.20,.24],[-.06,.09],[.12,.04],[.20,-.10],[.37,-.13],[.75,-.35]],[.012,.011,.014,.009,.012,.010,.009,.012]);
 const lower=ribbon([[-.20,.24],[-.16,.33],[-.23,.39],[-.20,.46]],[.011,.006,.003,0]);
 const upper=ribbon([[.20,-.10],[.15,-.22],[.21,-.29],[.18,-.39]],[.010,.006,.003,0]);
 const gap=polygonClipping.union(trunk,lower,upper);
 // The connected trunk leaves the footprint at both ends, so these are outer
 // contours rather than an invalid interior hole touching/crossing the rim.
 const [first,...rest]=rings.map(r=>[r] as polygonClipping.Polygon),footprint=polygonClipping.xor(first,...rest);
 return polygonClipping.difference(footprint,gap).flatMap(p=>p.map(raw=>{
  const ring=raw as ShapePoint[],a=ring[0],b=ring.at(-1)!;
  return a[0]===b[0]&&a[1]===b[1]?ring.slice(0,-1):ring;
 }));
}
