export type Point=[number,number];
export type Growth={center:Point;radius:number;seed:number};
function random(seed:number){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};}
type Stem={a:Point;b:Point;start:number;end:number;dx:number;dy:number;inverseLength:number;left:number;right:number;top:number;bottom:number};
/** A branching organism in metres: one body, broad curved lobes and rounded secondary splashes.
 * No cell centres or grid-neighbour directions participate in growth. */
export function growthField({center:[cx,cy],radius:r,seed}:Growth){
 const rng=random(seed),stems:Stem[]=[],rotation=rng()*Math.PI*2;
 const bodyAngle=rng()*Math.PI,cos=Math.cos(bodyAngle),sin=Math.sin(bodyAngle);
 const arms=10+Math.floor(rng()*6),phases=Array.from({length:4},()=>rng()*Math.PI*2);
 function branch(start:Point,angle:number,length:number,width:number,bend:number,tip:number){
  const samples:Point[]=[];
  for(let i=0;i<=9;i++){
   const t=i/9,along=length*t,side=Math.sin(t*Math.PI*.85)*bend;
   samples.push([start[0]+Math.cos(angle)*along-Math.sin(angle)*side,start[1]+Math.sin(angle)*along+Math.cos(angle)*side]);
   if(i){const taper=(u:number)=>width*Math.pow(1-u,.85)+tip,a=samples[i-1],b=samples[i],dx=b[0]-a[0],dy=b[1]-a[1];stems.push({a,b,start:taper((i-1)/9),end:taper(t),dx,dy,inverseLength:1/(dx*dx+dy*dy),left:Math.min(a[0],b[0]),right:Math.max(a[0],b[0]),top:Math.min(a[1],b[1]),bottom:Math.max(a[1],b[1])});}
  }
  return samples;
 }
 for(let i=0;i<arms;i++){
  const angle=rotation+rng()*Math.PI*2,length=r*(.35+rng()*.53),width=r*(.15+rng()*.11),bend=(rng()-.5)*r*.32;
  const start:Point=[Math.cos(angle)*r*.12,Math.sin(angle)*r*.12];
  const arm=branch(start,angle,length,width,bend,r*(.055+rng()*.035));
  const index=4+Math.floor(rng()*3),side=rng()>.5?1:-1;
  if(rng()>.35)branch(arm[index],angle+side*(.7+rng()*.8),r*(.07+rng()*.13),r*(.035+rng()*.035),(rng()-.5)*r*.08,r*(.020+rng()*.018));
 }
 const smoothMax=(a:number,b:number,k:number)=>{const h=Math.max(0,k-Math.abs(a-b))/k;return Math.max(a,b)+h*h*k*.25;};
 const body=(x:number,y:number)=>{
  x-=cx;y-=cy;
  const u=x*cos+y*sin,v=-x*sin+y*cos;
  let distance=(1-Math.hypot(u/(r*.50),v/(r*.37)))*r*.37;
  for(const stem of stems){
   // Exact conservative rejection: outside this upper distance bound the
   // smooth maximum contributes zero, so no accepted surface detail is lost.
   const gap=Math.max(stem.left-x,x-stem.right,stem.top-y,y-stem.bottom,0);
   if(stem.start-gap<=distance-r*.055)continue;
   const {dx,dy}=stem,t=Math.max(0,Math.min(1,((x-stem.a[0])*dx+(y-stem.a[1])*dy)*stem.inverseLength));
   const d=stem.start+(stem.end-stem.start)*t-Math.hypot(x-stem.a[0]-dx*t,y-stem.a[1]-dy*t);
   distance=smoothMax(distance,d,r*.055);
  }
  // Fine scalloping stays fixed in geographic space at every zoom.
  return distance+Math.sin(x/13+phases[0])*Math.cos(y/17+phases[1])*r*.012+Math.sin(x/5.7+y/8.1+phases[2])*r*.003;
 };
 // Small rounded accumulations along the free edge make a pooled splash lip.
 // Their positions are sampled from this organism's continuous surface, never cells.
 const lobules:{x:number;y:number;radius:number}[]=[];
 for(let i=0;i<22;i++){
  const angle=rng()*Math.PI*2,dx=Math.cos(angle),dy=Math.sin(angle),radius=r*(.025+rng()*.04);
  let edge=r*.1;
  while(edge<r*1.45&&body(cx+dx*edge,cy+dy*edge)>0)edge+=r*.018;
  const offset=edge+radius*(rng()*.5-.15);
  lobules.push({x:cx+dx*offset,y:cy+dy*offset,radius});
 }
 return (x:number,y:number)=>{
  let distance=body(x,y);
  for(const lobe of lobules)distance=smoothMax(distance,lobe.radius-Math.hypot(x-lobe.x,y-lobe.y),r*.015);
  return distance;
 };
}
