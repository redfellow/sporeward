import { createHash, randomUUID } from 'node:crypto';
import { collectRestoration, collectionFactor, resistanceDistance, restorationFraction } from '@sporeward/game';
import { FIELD_LAB_REWARD_NAMES, type FieldLabOffer, type FieldLabView, type LabCollectionResult } from '@sporeward/protocol';
import { ownerResistance, personalResistanceView, resistanceOwnerKey } from './resistance-state.ts';
import type { Persisted } from './world-store.ts';
import type { FieldLab } from './field-labs.ts';

const key = (player:string, id:string) => createHash('sha256').update(`${player}\0${id}`).digest('hex');
export function rewardName(identity:string) {
 const index=createHash('sha256').update(identity).digest().readUInt32BE(0)%FIELD_LAB_REWARD_NAMES.length;
 return FIELD_LAB_REWARD_NAMES[index];
}
export function labViews(state:Persisted,player:string,now:number):FieldLabView[] {
 return (state.fieldLabs?.labs??[]).filter(lab=>lab.spawnedAt<=now&&now<lab.expiresAt).map(lab=>({
  id:lab.id,name:'Field Lab',position:lab.position,ring:lab.ring,spawnedAt:lab.spawnedAt,expiresAt:lab.expiresAt,
  collected:!!state.labCollections?.[key(player,lab.id)],
 }));
}
export function issueLabOffer(state:Persisted,player:string,outingId:string,now:number):FieldLabOffer {
 if(!state.resistance?.enabled||!state.fieldLabs)throw Object.assign(new Error('Field Labs are not enabled.'),{statusCode:409});
 const identity=key(player,outingId);
 state.labOffers??={};
 const existing=state.labOffers[identity];
 // An outing cannot replace its quote by repeatedly requesting one after travelling.
 if(existing)return existing;
 const centre=personalResistanceView(state.resistance,player,now).centre;
 const factor=collectionFactor(ownerResistance(state.resistance,player),now);
 const labs=labViews(state,player,now).filter(lab=>!lab.collected).map(lab=>{
  const distanceMetres=centre?resistanceDistance({longitude:centre[0],latitude:centre[1]},{longitude:lab.position[0],latitude:lab.position[1]}):0;
  return {labId:lab.id,distanceMetres,fraction:restorationFraction(distanceMetres,factor)};
 });
 const offer:FieldLabOffer={id:randomUUID(),outingId,rulesVersion:1,worldStartedAt:state.startedAt,issuedAt:now,expiresAt:now+86400000,referenceCentre:centre,labs};
 state.labOffers[identity]=offer;return offer;
}

export function settleLabContact(state:Persisted,player:string,outingId:string,lab:FieldLab,contactAt:number,eligible:boolean,now:number):LabCollectionResult {
 const result:LabCollectionResult={labId:lab.id,contactAt,status:'ineligible',rewardName:null,offerSource:null,offeredFraction:0,actualFraction:0,resistanceReduction:0,limited:false};
 if(!eligible||!state.resistance?.enabled||contactAt<state.resistance.activatedAt||contactAt>now+30000)return result;
 if(contactAt<lab.spawnedAt||contactAt>=lab.expiresAt){result.status='expired';return result;}
 const identity=key(player,lab.id),previous=state.labCollections?.[identity];
 if(previous)return {...previous,contactAt,status:'already-collected',actualFraction:0,resistanceReduction:0,limited:true};
 const quote=state.labOffers?.[key(player,outingId)];
 const entry=quote?.labs.find(entry=>entry.labId===lab.id);
 const quoted=!!quote&&!!entry&&quote.worldStartedAt===state.startedAt&&quote.rulesVersion===1&&quote.issuedAt<=contactAt&&contactAt<quote.expiresAt;
 // Without a valid cached quote, upload is authoritative reconciliation, never a guaranteed offline amount.
 const centre=quoted?quote!.referenceCentre:personalResistanceView(state.resistance,player,now).centre;
 const distanceMetres=quoted?entry!.distanceMetres:centre?resistanceDistance({longitude:centre[0],latitude:centre[1]},{longitude:lab.position[0],latitude:lab.position[1]}):0;
 const personal=ownerResistance(state.resistance,player);
 const offeredFraction=quoted?entry!.fraction:restorationFraction(distanceMetres,collectionFactor(personal,now));
 const settled=collectRestoration(personal,identity,contactAt,distanceMetres,offeredFraction,Math.max(now,contactAt));
 state.resistance.players[resistanceOwnerKey(player)]=settled.state;
 const confirmed:LabCollectionResult={...result,status:'confirmed',rewardName:rewardName(identity),offerSource:quoted?'quoted':'reconciled',offeredFraction,actualFraction:settled.fraction,resistanceReduction:settled.reduction,limited:settled.fraction<offeredFraction||settled.reduction===0};
 state.labCollections??={};state.labCollections[identity]=confirmed;
 return confirmed;
}
