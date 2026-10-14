import {matchContacts} from '@sporeward/game';
import {activityReceipt,type WorldView,type EncounterRecap} from '@sporeward/protocol';
import type {Fix} from './model';
/** Local estimate only. Server validation and other players can change the result. */
export function previewEncounters(fixes:Fix[],world:WorldView|null,recap:EncounterRecap|null,now:number) {
 const contacts=world?matchContacts(fixes,world.outbreaks.map(o=>({id:o.id,ring:o.ring,validFrom:o.spawnedAt,validUntil:o.clearedAt===null?null:o.clearedAt+600000}))):[];
 const coveredDistance=activityReceipt({id:'preview',started:fixes[0]?.timestamp??now,ended:now,sections:[]},fixes,now).distanceMetres;
 const estimated=contacts.reduce((sum,c)=>{const o=world!.outbreaks.find(o=>o.id===c.outbreakId)!;return sum+(c.timestamp>=o.eligibleAt?o.visitPoints:0);},0);
 return {contacts,visited:new Set([...contacts.map(c=>c.outbreakId),...(recap?.encounters.map(e=>e.outbreakId)??[])]),distanceMetres:coveredDistance,provisionalPoints:coveredDistance>=500?estimated:0,heldPoints:coveredDistance<500?estimated:0};
}
