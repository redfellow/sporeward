/** Geographic contact rules shared by the recorder preview and authoritative API. */
export type Position = readonly [longitude:number, latitude:number];
export type ContactFix = { timestamp:number; longitude:number; latitude:number; segment:string | number };
export type Footprint = { id:string; ring:readonly Position[]; validFrom:number; validUntil:number | null };
export type Contact = { outbreakId:string; timestamp:number };
const EARTH=6371008.8, RAD=Math.PI/180;
function projected(point:Position, origin:Position):Position {
 return [(point[0]-origin[0])*RAD*EARTH*Math.cos(origin[1]*RAD),(point[1]-origin[1])*RAD*EARTH];
}
function distanceToSegment(p:Position,a:Position,b:Position) {
 const dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
 const t=length===0?0:Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length));
 return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
}
function inside(p:Position,ring:readonly Position[]) {
 let result=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
  const a=ring[i]!,b=ring[j]!;
  if((a[1]>p[1])!==(b[1]>p[1]) && p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])result=!result;
 }
 return result;
}
function touches(p:Position,ring:readonly Position[],tolerance:number) {
 if(inside(p,ring))return true;
 return ring.some((a,i)=>distanceToSegment(p,a,ring[(i+1)%ring.length]!)<=tolerance);
}
/** First contact per outbreak. Historical footprint intervals are half-open.
 * Interpolation is confined to the same recorded section and gaps of at most two seconds.
 * Convex distance along each polygon edge is solved by bisection around its minimum;
 * this detects narrow crossings without a sampling grid.
 */
export function matchContacts(fixes:readonly ContactFix[],footprints:readonly Footprint[],tolerance=10):Contact[] {
 if(!Number.isFinite(tolerance)||tolerance<0)throw new Error('Invalid contact tolerance.');
 for(let i=0;i<fixes.length;i++) {
  const f=fixes[i]!;
  if(!Number.isFinite(f.timestamp)||!Number.isFinite(f.longitude)||!Number.isFinite(f.latitude)||Math.abs(f.latitude)>90||Math.abs(f.longitude)>180 || i>0&&f.timestamp<=fixes[i-1]!.timestamp)throw new Error('GPS fixes must be valid and ordered.');
 }
 const found=new Map<string,number>();
 for(const footprint of footprints) {
  if(footprint.ring.length<3||footprint.ring.some(p=>!Number.isFinite(p[0])||!Number.isFinite(p[1])||Math.abs(p[0])>180||Math.abs(p[1])>85)||!Number.isFinite(footprint.validFrom)||!(footprint.validUntil===null||Number.isFinite(footprint.validUntil)&&footprint.validUntil>=footprint.validFrom))throw new Error('Invalid footprint.');
  const origin=footprint.ring[0]!,ring=footprint.ring.map(p=>projected(p,origin));
  const until=footprint.validUntil??Infinity;
  const xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]);
  const bounds=[Math.min(...xs)-tolerance,Math.min(...ys)-tolerance,Math.max(...xs)+tolerance,Math.max(...ys)+tolerance];
  for(let i=0;i<fixes.length;i++) {
   const f=fixes[i]!,prev=fixes[i-1];
   if(prev && (found.get(footprint.id)??Infinity)<=prev.timestamp)break;
   if(f.timestamp<footprint.validFrom)continue;
   if(prev&&prev.timestamp>=until)break;
   const point=projected([f.longitude,f.latitude],origin);
   if(f.timestamp>=footprint.validFrom&&f.timestamp<until&&point[0]>=bounds[0]!&&point[0]<=bounds[2]!&&point[1]>=bounds[1]!&&point[1]<=bounds[3]!&&touches(point,ring,tolerance)) {
    found.set(footprint.id,Math.min(found.get(footprint.id)??Infinity,f.timestamp));
   }
   if(!prev||prev.segment!==f.segment||f.timestamp-prev.timestamp>2000)continue;
   const start=Math.max(prev.timestamp,footprint.validFrom),end=Math.min(f.timestamp,until-0.001);
   if(start>end)continue;
   const a=projected([prev.longitude,prev.latitude],origin),b=projected([f.longitude,f.latitude],origin);
   if(Math.max(a[0],b[0])<bounds[0]! || Math.min(a[0],b[0])>bounds[2]! || Math.max(a[1],b[1])<bounds[1]! || Math.min(a[1],b[1])>bounds[3]!)continue;
   const at=(time:number):Position=>{const t=(time-prev.timestamp)/(f.timestamp-prev.timestamp);return [a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])];};
   let first=touches(at(start),ring,tolerance)?start:Infinity;
   for(let edge=0;edge<ring.length;edge++) {
    const c=ring[edge]!,d=ring[(edge+1)%ring.length]!;
    const distance=(time:number)=>distanceToSegment(at(time),c,d);
    let lo=start,hi=end;
    for(let step=0;step<45;step++){const l=lo+(hi-lo)/3,r=hi-(hi-lo)/3;if(distance(l)<=distance(r))hi=r;else lo=l;}
    const minimum=(lo+hi)/2;
    if(distance(minimum)>tolerance+1e-7)continue;
    lo=start;hi=minimum;
    for(let step=0;step<45;step++){const mid=(lo+hi)/2;if(distance(mid)<=tolerance)hi=mid;else lo=mid;}
    first=Math.min(first,hi);
   }
   if(Number.isFinite(first))found.set(footprint.id,Math.min(found.get(footprint.id)??Infinity,Math.ceil(first)));
  }
 }
 return [...found].map(([outbreakId,timestamp])=>({outbreakId,timestamp})).sort((a,b)=>a.timestamp-b.timestamp||a.outbreakId.localeCompare(b.outbreakId));
}
