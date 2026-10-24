import {destinationSummary,indexDestinations,recentDestinationLocation,type DestinationContext,type DestinationFocus,type DestinationSummary} from './destination-focus';

export type NearbyFilter='all'|'outbreak'|'lab';
export type NearbySection={title:string;data:DestinationSummary[]};
export type NearbyDestinations={sections:NearbySection[];count:number;located:boolean;empty:string};
export type NearbyContext=Omit<DestinationContext,'focus'>;
export const destinationKey=(focus:DestinationFocus)=>`${focus.kind}:${focus.id}`;

/** Presentation-only comparison across the received world, independent of camera bounds. */
export function nearbyDestinations(context:NearbyContext,filter:NearbyFilter='all'):NearbyDestinations{
 const {world,location,now}=context,located=recentDestinationLocation(location,now);
 const empty=!world?'No world data yet. Connect to load destinations.':filter==='lab'?'No Field Labs in the loaded world.':filter==='outbreak'?'No outbreaks in the loaded world.':'No destinations in the loaded world.';
 if(!world)return {sections:[],count:0,located,empty};
 const index=indexDestinations(context),available:DestinationSummary[]=[],unavailable:DestinationSummary[]=[];
 const targets:DestinationFocus[]=[
  ...(filter==='lab'?[]:world.outbreaks.map(o=>({kind:'outbreak' as const,id:o.id}))),
  ...(filter==='outbreak'?[]:(world.fieldLabs??[]).filter(l=>l.expiresAt>world.serverTime).map(l=>({kind:'lab' as const,id:l.id}))),
 ];
 for(const focus of targets){
  const row=destinationSummary({...context,focus},index)!;
  if(['cleared','expired','unavailable'].includes(row.availability))continue;
  (row.availability==='available'||row.availability==='clearing'?available:unavailable).push(row);
 }
 const compare=(a:DestinationSummary,b:DestinationSummary)=>{
  if(located&&a.metres!==b.metres){
   if(a.metres===null)return 1;if(b.metres===null)return -1;
   return a.metres-b.metres;
  }
  return a.name.localeCompare(b.name)||destinationKey(a.focus).localeCompare(destinationKey(b.focus));
 };
 const sections:NearbySection[]=[];
 if(available.length)sections.push({title:'Available to you',data:available.sort(compare)});
 if(unavailable.length)sections.push({title:'Not available now',data:unavailable.sort(compare)});
 return {sections,count:available.length+unavailable.length,located,empty};
}

/** Re-resolve row selection; a received removal or expiry must not open stale details. */
export function nearbyTargetExists(focus:DestinationFocus,world:NearbyContext['world']):boolean{
 if(!world)return false;
 if(focus.kind==='lab')return !!world.fieldLabs?.some(l=>l.id===focus.id&&l.expiresAt>world.serverTime);
 return world.outbreaks.some(o=>o.id===focus.id&&o.status!=='cleared'&&!(o.lifecycle==='remnant'&&o.phaseEndsAt!=null&&o.phaseEndsAt<=world.serverTime));
}
