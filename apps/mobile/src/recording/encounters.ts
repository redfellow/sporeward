import {matchContacts} from '@sporeward/game';
import {activityReceipt,type WorldView,type EncounterRecap} from '@sporeward/protocol';
import type {Fix} from './model';
export type ContactPreview={outbreakId:string;timestamp:number;visitPoints:number};
/** Local estimate only. Server validation and other players can change the result. */
export function previewEncounters(fixes:Fix[],world:WorldView|null,recap:EncounterRecap|null,now:number,observed:ContactPreview[]=[] ) {
 const contacts=world?matchContacts(fixes,world.outbreaks.map(o=>({id:o.id,ring:o.ring,validFrom:o.spawnedAt,validUntil:o.clearedAt===null?null:o.clearedAt+600000}))):[];
 const coveredDistance=activityReceipt({id:'preview',started:fixes[0]?.timestamp??now,ended:now,sections:[]},fixes,now).distanceMetres;
 const known=new Map(observed.map(c=>[c.outbreakId,c]));
 for(const c of contacts){
  const o=world!.outbreaks.find(o=>o.id===c.outbreakId)!,previous=known.get(c.outbreakId);
  if(!previous||c.timestamp<previous.timestamp)known.set(c.outbreakId,{...c,visitPoints:c.timestamp>=o.eligibleAt?o.visitPoints:0});
 }
 const observations=[...known.values()].sort((a,b)=>a.timestamp-b.timestamp||a.outbreakId.localeCompare(b.outbreakId));
 const estimated=observations.reduce((sum,c)=>sum+c.visitPoints,0);
 return {contacts,observations,visited:new Set([...observations.map(c=>c.outbreakId),...(recap?.encounters.map(e=>e.outbreakId)??[])]),distanceMetres:coveredDistance,provisionalPoints:coveredDistance>=500?estimated:0,heldPoints:coveredDistance<500?estimated:0};
}
