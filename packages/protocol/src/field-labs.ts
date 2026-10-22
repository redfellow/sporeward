import type { Coordinate } from './world';
export const FIELD_LAB_REWARD_NAMES = [
 'Antiviral Booster', 'Rare Specimen', 'Counterstrain', 'Protocol Override', 'Adaptive Serum',
 'Wildtype Extract', 'Resistance Breaker', 'Mutation Antidote', 'Experimental Batch', 'Strain Disruptor',
] as const;
export type FieldLabRewardName = typeof FIELD_LAB_REWARD_NAMES[number];
export type FieldLabView = { id:string;name:'Field Lab';position:Coordinate;ring:Coordinate[];spawnedAt:number;expiresAt:number;collected:boolean };
export type FieldLabOffer = { id:string;outingId:string;rulesVersion:1;worldStartedAt:number;issuedAt:number;expiresAt:number;referenceCentre:Coordinate|null;labs:{labId:string;distanceMetres:number;fraction:number}[] };
export type LabCollectionResult = { labId:string;contactAt:number;status:'confirmed'|'already-collected'|'expired'|'ineligible';rewardName:FieldLabRewardName|null;offerSource:'quoted'|'reconciled'|null;offeredFraction:number;actualFraction:number;resistanceReduction:number;limited:boolean };

const object = (v:unknown):v is Record<string,unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const nonnegative = (v:unknown):v is number => typeof v === 'number' && Number.isFinite(v) && v>=0;
const fraction = (v:unknown):v is number => nonnegative(v)&&v<=1;
const text = (v:unknown):v is string => typeof v === 'string'&&v.length>0&&v.length<=200;
const coordinate = (v:unknown):boolean => Array.isArray(v)&&v.length===2&&typeof v[0]==='number'&&Number.isFinite(v[0])&&Math.abs(v[0])<=180&&typeof v[1]==='number'&&Number.isFinite(v[1])&&Math.abs(v[1])<=85;
export function parseFieldLabView(v:unknown):FieldLabView {
 if(!object(v)||!text(v.id)||v.name!=='Field Lab'||!coordinate(v.position)||!Array.isArray(v.ring)||v.ring.length<3||v.ring.length>500||!v.ring.every(coordinate)||!nonnegative(v.spawnedAt)||!nonnegative(v.expiresAt)||v.expiresAt<=v.spawnedAt||typeof v.collected!=='boolean')throw new Error('Invalid Field Lab');
 return v as FieldLabView;
}
export function parseFieldLabOffer(v:unknown):FieldLabOffer {
 if(!object(v)||!text(v.id)||!text(v.outingId)||v.rulesVersion!==1||!nonnegative(v.worldStartedAt)||!nonnegative(v.issuedAt)||!nonnegative(v.expiresAt)||v.expiresAt<=v.issuedAt||!(v.referenceCentre===null||coordinate(v.referenceCentre))||!Array.isArray(v.labs)||v.labs.length>1000)throw new Error('Invalid Field Lab offer');
 const ids=new Set<string>();
 for(const lab of v.labs){if(!object(lab)||!text(lab.labId)||ids.has(lab.labId)||!nonnegative(lab.distanceMetres)||!fraction(lab.fraction))throw new Error('Invalid Field Lab offer entry');ids.add(lab.labId);}
 return v as FieldLabOffer;
}
export function parseLabCollection(v:unknown):LabCollectionResult {
 if(!object(v)||!text(v.labId)||!nonnegative(v.contactAt)||!['confirmed','already-collected','expired','ineligible'].includes(String(v.status))||!(v.rewardName===null||FIELD_LAB_REWARD_NAMES.includes(v.rewardName as FieldLabRewardName))||!['quoted','reconciled',null].includes(v.offerSource as 'quoted'|'reconciled'|null)||!fraction(v.offeredFraction)||!fraction(v.actualFraction)||v.actualFraction>v.offeredFraction||!nonnegative(v.resistanceReduction)||typeof v.limited!=='boolean')throw new Error('Invalid lab collection');
 return v as LabCollectionResult;
}
