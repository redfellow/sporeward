import {parseFieldLabView,parseLabCollection,type FieldLabView,type LabCollectionResult} from './field-labs';
export type Coordinate=[number,number];
export type OutbreakView={crossings?:number;scoringVersion?:2;lifecycle?:'ordinary'|'disintegrating'|'remnant'|'stabilizing';phaseEndsAt?:number|null;id:string;name:string;ring:Coordinate[];spawnedAt:number;clearedAt:number|null;status:'active'|'withering'|'clearing'|'cleared';strength:number;committedCleaning:number;visitsRemaining:number;visitPoints:number;cleanupBonus:number;eligibleAt:number};
export type RenderTest={examples:{name:string;ids:string[];visited?:boolean}[]};
export type WorldView={renderTest?:RenderTest;version:1;serverTime:number;worldStartedAt:number;outbreaks:OutbreakView[];resistance?:ResistanceView;fieldLabs?:FieldLabView[]};
export type EncounterResult={scoringVersion?:2;outbreakId:string;name:string;contactAt:number;visitPoints:number;cleanupPoints:number;accepted:boolean;reason:'accepted'|'cooldown'|'duplicate'|'expired'|'ineligible';contributionId:string|null};
export type EncounterRecap={activityId:string;confirmedVisitPoints:number;confirmedCleanupPoints:number;pendingCleanupPoints:number;encounters:EncounterResult[];updatedAt:number;labCollections?:LabCollectionResult[]};
export type ResistanceView={rulesVersion:1;scoringVersion:2;activatedAt:number;centre:Coordinate|null;radiusMetres:number;centreResistance:number};
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const number=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
// Density limits ordinary outbreaks; transient remnants need additional capacity.
export const MAX_WORLD_OUTBREAKS=10000,MAX_WORLD_VERTICES=1000000;
export function parseWorldView(value:unknown):WorldView {
 if(!record(value)||value.version!==1||!number(value.serverTime)||!number(value.worldStartedAt)||!Array.isArray(value.outbreaks)||value.outbreaks.length>MAX_WORLD_OUTBREAKS)throw new Error('Invalid world response.');
 if(value.renderTest!==undefined){
  const test=value.renderTest,outbreaks=value.outbreaks;
  if(!record(test)||!Array.isArray(test.examples)||test.examples.length>32||!test.examples.every(e=>record(e)&&typeof e.name==='string'&&e.name.length<=80&&Array.isArray(e.ids)&&e.ids.length>0&&e.ids.length<=8&&e.ids.every(id=>typeof id==='string'&&outbreaks.some((o:unknown)=>record(o)&&o.id===id))&&(e.visited===undefined||typeof e.visited==='boolean')))throw new Error('Invalid render test.');
 }
 if(value.resistance!==undefined)parseResistanceView(value.resistance);
 if(value.fieldLabs!==undefined){if(!Array.isArray(value.fieldLabs)||value.fieldLabs.length>1000)throw new Error('Invalid Field Labs');value.fieldLabs.forEach(parseFieldLabView);}
 let vertices=0;
 for(const o of value.outbreaks) {
  if(record(o)&&o.crossings!==undefined&&(!Number.isSafeInteger(o.crossings)||Number(o.crossings)<0))throw new Error('Invalid crossing count.');
  if(record(o)&&o.scoringVersion!==undefined&&o.scoringVersion!==2)throw new Error('Invalid scoring version.');
  if(record(o)&&Array.isArray(o.ring)&&(vertices+=o.ring.length)>MAX_WORLD_VERTICES)throw new Error('World geometry exceeds the supported budget.');
  if(record(o)&&((o.lifecycle!==undefined&&!['ordinary','disintegrating','remnant','stabilizing'].includes(String(o.lifecycle)))||(o.phaseEndsAt!==undefined&&o.phaseEndsAt!==null&&!number(o.phaseEndsAt))))throw new Error('Invalid outbreak lifecycle.');
  if(!record(o)||typeof o.id!=='string'||typeof o.name!=='string'||!Array.isArray(o.ring)||o.ring.length<3||o.ring.length>500||!o.ring.every(p=>Array.isArray(p)&&p.length===2&&typeof p[0]==='number'&&Number.isFinite(p[0])&&Math.abs(p[0])<=180&&typeof p[1]==='number'&&Number.isFinite(p[1])&&Math.abs(p[1])<=85)||!number(o.spawnedAt)||!(o.clearedAt===null||number(o.clearedAt))||!['active','withering','clearing','cleared'].includes(String(o.status))||!['strength','committedCleaning','visitsRemaining','visitPoints','cleanupBonus','eligibleAt'].every(k=>number(o[k])))throw new Error('Invalid outbreak response.');
 }
 return value as WorldView;
}
export function parseEncounterRecap(value:unknown,activityId:string):EncounterRecap {
 if(!record(value)||value.activityId!==activityId||!number(value.confirmedVisitPoints)||!number(value.confirmedCleanupPoints)||!number(value.pendingCleanupPoints)||!number(value.updatedAt)||!Array.isArray(value.encounters)||value.encounters.length>1000)throw new Error('Invalid encounter recap.');
 for(const e of value.encounters)if(!record(e)||(e.scoringVersion!==undefined&&e.scoringVersion!==2)||typeof e.outbreakId!=='string'||typeof e.name!=='string'||!number(e.contactAt)||!number(e.visitPoints)||!number(e.cleanupPoints)||typeof e.accepted!=='boolean'||!['accepted','cooldown','duplicate','expired','ineligible'].includes(String(e.reason))||!(e.contributionId===null||typeof e.contributionId==='string'))throw new Error('Invalid encounter result.');
 if(value.labCollections!==undefined){if(!Array.isArray(value.labCollections)||value.labCollections.length>1000)throw new Error('Invalid lab recap');value.labCollections.forEach(parseLabCollection);}
 return value as EncounterRecap;
}

export function parseResistanceView(value:unknown):ResistanceView {
 if(!record(value)||value.rulesVersion!==1||value.scoringVersion!==2||!number(value.activatedAt)||!number(value.radiusMetres)||value.radiusMetres===0||!number(value.centreResistance)||!(value.centre===null||Array.isArray(value.centre)&&value.centre.length===2&&typeof value.centre[0]==='number'&&Number.isFinite(value.centre[0])&&Math.abs(value.centre[0])<=180&&typeof value.centre[1]==='number'&&Number.isFinite(value.centre[1])&&Math.abs(value.centre[1])<=90))throw new Error('Invalid private resistance response.');
 return value as ResistanceView;
}
