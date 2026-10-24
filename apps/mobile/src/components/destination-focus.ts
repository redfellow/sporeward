import type {Coordinate,EncounterRecap,FieldLabOffer,WorldView} from '@sporeward/protocol';

export type DestinationFocus={kind:'outbreak'|'lab';id:string};
export type DestinationLocation={coordinate:Coordinate;timestamp:number};
export type DestinationSummary={
 focus:DestinationFocus;name:string;ring:Coordinate[]|null;
 availability:'available'|'cooldown'|'clearing'|'cleared'|'splitting'|'expired'|'collected'|'unavailable';
 status:string;availableAt:number|null;reward:string|null;effort:string|null;contact:string|null;distance:string;
};
const MAX_LOCATION_AGE=120000,EARTH=6371008.8,RAD=Math.PI/180;

/** Presentation-only distance: no GPS interpolation, tolerance or visit side effects. */
export function distanceToTarget(ring:Coordinate[],location:DestinationLocation|null,now:number):number|null{
 if(ring.length<3||!location||!Number.isFinite(location.timestamp)||location.timestamp>now+5000||now-location.timestamp>MAX_LOCATION_AGE)return null;
 const [lon,lat]=location.coordinate;
 if(!Number.isFinite(lon)||!Number.isFinite(lat)||Math.abs(lon)>180||Math.abs(lat)>85)return null;
 let inside=false,minimum=Infinity;
 const project=([x,y]:Coordinate):Coordinate=>[(x-lon)*RAD*EARTH*Math.cos(lat*RAD),(y-lat)*RAD*EARTH];
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[j],b=ring[i];
  if((a[1]>lat)!==(b[1]>lat)&&lon<(b[0]-a[0])*(lat-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  const [ax,ay]=project(a),[bx,by]=project(b),dx=bx-ax,dy=by-ay,length=dx*dx+dy*dy;
  const t=length?Math.max(0,Math.min(1,-(ax*dx+ay*dy)/length)):0;
  minimum=Math.min(minimum,Math.hypot(ax+t*dx,ay+t*dy));
 }
 return inside||minimum<1e-6?0:Number.isFinite(minimum)?minimum:null;
}
export function directDistanceLabel(metres:number|null){
 if(metres===null)return 'Distance unavailable · no recent location';
 if(metres===0)return 'In target area · proximity only';
 return `${metres<1000?`${Math.max(10,Math.round(metres/10)*10)} m`:`${(metres/1000).toFixed(1)} km`} straight-line to area`;
}
const percentage=(fraction:number)=>fraction>0&&fraction<.005?'<1%':`${Math.round(fraction*100)}%`;
type Context={focus:DestinationFocus|null;world:WorldView|null;location:DestinationLocation|null;now:number;outingId?:string|null;visited?:ReadonlySet<string>;provisionalLabs?:ReadonlySet<string>;offer?:FieldLabOffer|null;recap?:EncounterRecap|null};

export function destinationSummary({focus,world,location,now,outingId=null,visited,provisionalLabs,offer,recap}:Context):DestinationSummary|null{
 if(!focus)return null;
 const summary:DestinationSummary={focus,name:focus.kind==='lab'?'Field Lab':'Outbreak',ring:null,availability:'unavailable',status:world?'No longer available':'Map unavailable',availableAt:null,reward:null,effort:null,contact:null,distance:'Distance unavailable'};
 if(!world)return summary;
 const time=world.serverTime,confirmed=recap?.activityId===outingId?recap:null;
 if(focus.kind==='lab'){
  const lab=world.fieldLabs?.find(item=>item.id===focus.id);if(!lab)return summary;
  summary.ring=lab.ring;
  const result=confirmed?.labCollections?.find(item=>item.labId===lab.id),collected=lab.collected||result?.status==='confirmed'||result?.status==='already-collected';
  summary.availability=collected?'collected':lab.expiresAt<=time?'expired':'available';
  summary.status=collected?'Collected by you':summary.availability==='expired'?'Expired':'Available to you';
  if(result?.status==='confirmed')summary.reward=result.resistanceReduction>0?`${result.rewardName??'Field Lab'} · ${result.actualFraction>0?percentage(result.actualFraction)+' restoration':'resistance restored'}`:'No resistance restored in this collection';
  else if(summary.availability==='available'){
   const quoted=offer?.outingId===outingId&&offer.worldStartedAt===world.worldStartedAt&&offer.expiresAt>time?offer.labs.find(item=>item.labId===lab.id):null;
   summary.reward=quoted?`Up to ${percentage(quoted.fraction)} restoration · confirms on upload`:'Restoration unconfirmed · no outing offer';
  }
  if(outingId&&provisionalLabs?.has(lab.id)&&!collected)summary.contact='Contact recorded · collection provisional';
 }else{
  const outbreak=world.outbreaks.find(item=>item.id===focus.id);if(!outbreak)return summary;
  summary.name=outbreak.name;summary.ring=outbreak.ring;
  const expired=outbreak.lifecycle==='remnant'&&outbreak.phaseEndsAt!==null&&outbreak.phaseEndsAt!==undefined&&outbreak.phaseEndsAt<=time;
  summary.availability=outbreak.status==='cleared'?'cleared':expired?'expired':outbreak.lifecycle==='stabilizing'?'splitting':outbreak.eligibleAt>time?'cooldown':outbreak.status==='clearing'?'clearing':'available';
  summary.status=summary.availability==='cooldown'?'On cooldown':summary.availability==='cleared'?'Cleared':summary.availability==='expired'?'Expired':summary.availability==='splitting'?'Splitting · visits paused':summary.availability==='clearing'?'Clearing':'Available';
  if(summary.availability==='cooldown')summary.availableAt=outbreak.eligibleAt;
  if(summary.availability==='available'||summary.availability==='clearing'){
   summary.reward=outbreak.lifecycle==='remnant'?`${outbreak.cleanupBonus} possible cleanup points`:`${outbreak.visitPoints} visit points · +${outbreak.cleanupBonus} possible cleanup`;
   summary.effort=outbreak.lifecycle==='remnant'?'One eligible touch clears this remnant':outbreak.status==='clearing'?'Committed cleaning is expected to finish it':`~${outbreak.visitsRemaining} visits after committed cleaning`;
  }
  const encounter=confirmed?.encounters.find(item=>item.outbreakId===outbreak.id);
  if(encounter)summary.contact=encounter.accepted?'Visit confirmed':`Contact confirmed · ${encounter.reason}`;
  else if(outingId&&visited?.has(outbreak.id))summary.contact='Contact recorded · award unconfirmed';
 }
 summary.distance=directDistanceLabel(distanceToTarget(summary.ring,location,now));
 return summary;
}
