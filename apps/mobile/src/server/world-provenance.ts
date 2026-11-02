import type {WorldView} from '@sporeward/protocol';
import type {OverviewSnapshotStatus} from '../components/resistance-overview';

/**
 * In-memory receive/provenance status for the world snapshot held by `useWorld`.
 * It is never persisted: the legacy world cache is keyed by player only, so a cached snapshot is
 * `unattributed` until a fetch for the current account and server establishes it.
 */
export type WorldProvenance={
 /** `server|player` identity the status belongs to; null before any identity is known. */
 key:string|null;source:'received'|'unattributed'|'none';
 receivedAt:number|null;worldStartedAt:number|null;refresh:'idle'|'loading'|'failed';
};
export type ProvenanceEvent=
 |{type:'reset'}
 |{type:'cache';key:string}
 |{type:'refreshing';key:string}
 |{type:'received';key:string;at:number;worldStartedAt:number}
 |{type:'failed';key:string};

export const NO_PROVENANCE:WorldProvenance={key:null,source:'none',receivedAt:null,worldStartedAt:null,refresh:'idle'};
export const worldIdentity=(server:string,player:string)=>`${server}|${player}`;

export function reduceProvenance(state:WorldProvenance,event:ProvenanceEvent):WorldProvenance{
 switch(event.type){
  case 'reset':return NO_PROVENANCE;
  case 'cache':
   // A cache load never upgrades or overrides an attributable snapshot for the same identity.
   if(state.key===event.key&&state.source==='received')return state;
   return {...NO_PROVENANCE,key:event.key,source:'unattributed'};
  case 'refreshing':return state.key===event.key?{...state,refresh:'loading'}:{...NO_PROVENANCE,key:event.key,refresh:'loading'};
  case 'received':return {key:event.key,source:'received',receivedAt:event.at,worldStartedAt:event.worldStartedAt,refresh:'idle'};
  case 'failed':return state.key===event.key?{...state,refresh:'failed'}:state;
 }
}

/** Status for the overview: the world on screen must be the one the status describes. */
export function overviewSnapshotStatus(state:WorldProvenance,world:WorldView|null):OverviewSnapshotStatus{
 if(!world||state.key===null)return {source:'none',receivedAt:null,refresh:state.refresh==='loading'?'loading':'idle'};
 if(state.source==='received'&&state.worldStartedAt!==world.worldStartedAt)return {source:'unattributed',receivedAt:null,refresh:state.refresh};
 return {source:state.source,receivedAt:state.receivedAt,refresh:state.refresh};
}
