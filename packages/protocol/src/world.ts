export type Coordinate=[number,number];
export type OutbreakView={lifecycle?:'ordinary'|'disintegrating'|'remnant'|'stabilizing';phaseEndsAt?:number|null;id:string;name:string;ring:Coordinate[];spawnedAt:number;clearedAt:number|null;status:'active'|'withering'|'clearing'|'cleared';strength:number;committedCleaning:number;visitsRemaining:number;visitPoints:number;cleanupBonus:number;eligibleAt:number};
export type WorldView={version:1;serverTime:number;worldStartedAt:number;outbreaks:OutbreakView[]};
export type EncounterResult={outbreakId:string;name:string;contactAt:number;visitPoints:number;cleanupPoints:number;accepted:boolean;reason:'accepted'|'cooldown'|'duplicate'|'expired'|'ineligible';contributionId:string|null};
export type EncounterRecap={activityId:string;confirmedVisitPoints:number;confirmedCleanupPoints:number;pendingCleanupPoints:number;encounters:EncounterResult[];updatedAt:number};
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const number=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
// Density limits ordinary outbreaks; transient remnants need additional capacity.
export const MAX_WORLD_OUTBREAKS=10000,MAX_WORLD_VERTICES=1000000;
export function parseWorldView(value:unknown):WorldView {
 if(!record(value)||value.version!==1||!number(value.serverTime)||!number(value.worldStartedAt)||!Array.isArray(value.outbreaks)||value.outbreaks.length>MAX_WORLD_OUTBREAKS)throw new Error('Invalid world response.');
 let vertices=0;
 for(const o of value.outbreaks) {
  if(record(o)&&Array.isArray(o.ring)&&(vertices+=o.ring.length)>MAX_WORLD_VERTICES)throw new Error('World geometry exceeds the supported budget.');
  if(record(o)&&((o.lifecycle!==undefined&&!['ordinary','disintegrating','remnant','stabilizing'].includes(String(o.lifecycle)))||(o.phaseEndsAt!==undefined&&o.phaseEndsAt!==null&&!number(o.phaseEndsAt))))throw new Error('Invalid outbreak lifecycle.');
  if(!record(o)||typeof o.id!=='string'||typeof o.name!=='string'||!Array.isArray(o.ring)||o.ring.length<3||o.ring.length>500||!o.ring.every(p=>Array.isArray(p)&&p.length===2&&typeof p[0]==='number'&&Number.isFinite(p[0])&&Math.abs(p[0])<=180&&typeof p[1]==='number'&&Number.isFinite(p[1])&&Math.abs(p[1])<=85)||!number(o.spawnedAt)||!(o.clearedAt===null||number(o.clearedAt))||!['active','withering','clearing','cleared'].includes(String(o.status))||!['strength','committedCleaning','visitsRemaining','visitPoints','cleanupBonus','eligibleAt'].every(k=>number(o[k])))throw new Error('Invalid outbreak response.');
 }
 return value as WorldView;
}
export function parseEncounterRecap(value:unknown,activityId:string):EncounterRecap {
 if(!record(value)||value.activityId!==activityId||!number(value.confirmedVisitPoints)||!number(value.confirmedCleanupPoints)||!number(value.pendingCleanupPoints)||!number(value.updatedAt)||!Array.isArray(value.encounters)||value.encounters.length>1000)throw new Error('Invalid encounter recap.');
 for(const e of value.encounters)if(!record(e)||typeof e.outbreakId!=='string'||typeof e.name!=='string'||!number(e.contactAt)||!number(e.visitPoints)||!number(e.cleanupPoints)||typeof e.accepted!=='boolean'||!['accepted','cooldown','duplicate','expired','ineligible'].includes(String(e.reason))||!(e.contributionId===null||typeof e.contributionId==='string'))throw new Error('Invalid encounter result.');
 return value as EncounterRecap;
}
