import {growthField,type Growth,type Point} from './growth-field';

/** Continuous-field contour used by the accepted guide, independent of cells. */
export function growthContours(growth:Growth,step=4):Point[][]{
 const {center:[cx,cy],radius:r}=growth,field=growthField(growth);
 const west=cx-r*1.7,north=cy-r*1.7,n=Math.ceil(r*3.4/step);
 const values=Array.from({length:n+1},(_,y)=>Array.from({length:n+1},(_,x)=>field(west+x*step,north+y*step)));
 const vertices=new Map<string,Point>(),links=new Map<string,string[]>();
 const connect=(a:string,b:string)=>{links.set(a,[...(links.get(a)??[]),b]);links.set(b,[...(links.get(b)??[]),a]);};
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const v=[values[y][x],values[y][x+1],values[y+1][x+1],values[y+1][x]],p:Point[]=[[west+x*step,north+y*step],[west+(x+1)*step,north+y*step],[west+(x+1)*step,north+(y+1)*step],[west+x*step,north+(y+1)*step]],keys=[`h${x},${y}`,`v${x+1},${y}`,`h${x},${y+1}`,`v${x},${y}`],edges:number[]=[];
  for(let e=0;e<4;e++){const j=(e+1)%4;if((v[e]>0)===(v[j]>0))continue;edges.push(e);const t=v[e]/(v[e]-v[j]);vertices.set(keys[e],[p[e][0]+t*(p[j][0]-p[e][0]),p[e][1]+t*(p[j][1]-p[e][1])]);}
  if(edges.length===2)connect(keys[edges[0]],keys[edges[1]]);
  else if(edges.length===4){if((v.reduce((a,b)=>a+b,0)>0)===(v[0]>0)){connect(keys[0],keys[1]);connect(keys[2],keys[3]);}else{connect(keys[0],keys[3]);connect(keys[1],keys[2]);}}
 }
 const visited=new Set<string>(),rings:Point[][]=[];
 for(const start of links.keys()){
  if(visited.has(start))continue;
  let current=start,previous='';const ring:Point[]=[];
  while(!visited.has(current)){visited.add(current);ring.push(vertices.get(current)!);const next=links.get(current)?.find(k=>k!==previous);if(!next)break;previous=current;current=next;}
  if(current===start&&ring.length>3)rings.push(ring);
 }
 return rings;
}
