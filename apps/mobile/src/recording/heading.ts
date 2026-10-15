import type {Fix} from './model';
/** Travel bearing from recent continuous movement, avoiding stationary GPS drift. */
export function travelHeading(fixes:Fix[]):number|null{
 const last=fixes.at(-1);if(!last)return null;
 const rad=Math.PI/180;
 for(let i=fixes.length-2;i>=0;i--){
  const a=fixes[i],next=fixes[i+1];if(a.segment!==last.segment||next.timestamp-a.timestamp>2000||last.timestamp-a.timestamp>30000)break;
  const dx=(last.longitude-a.longitude)*rad*6371008.8*Math.cos(last.latitude*rad),dy=(last.latitude-a.latitude)*rad*6371008.8;
  if(Math.hypot(dx,dy)<Math.max(12,a.accuracy??0,last.accuracy??0))continue;
  const y=Math.sin((last.longitude-a.longitude)*rad)*Math.cos(last.latitude*rad),x=Math.cos(a.latitude*rad)*Math.sin(last.latitude*rad)-Math.sin(a.latitude*rad)*Math.cos(last.latitude*rad)*Math.cos((last.longitude-a.longitude)*rad);
  return (Math.atan2(y,x)/rad+360)%360;
 }
 return null;
}
