import type {EncounterRecap} from '@sporeward/protocol';

export type FeedbackScope={owner:string;activity:string;environment:string;world:number};
export type ContactEntry={
 kind:'outbreak'|'lab';id:string;name:string;timestamp:number;estimate:number|null;
 reason:'cooldown'|'unknown';consumed:boolean;offerFraction?:number;outcome?:{status:'confirmed'|'rejected';text:string};
};
export const contactKey=(e:Pick<ContactEntry,'kind'|'id'>)=>`${e.kind}:${e.id}`;
export const scopeKey=(s:FeedbackScope)=>JSON.stringify([s.owner,s.activity,s.environment,s.world]);

/** A log summary, never a second score ledger. Earlier observations retain their estimate. */
export function mergeContactEntries(saved:ContactEntry[],incoming:ContactEntry[],recap:EncounterRecap|null,activity:string):ContactEntry[]{
 const entries=new Map(saved.map(e=>[contactKey(e),e]));
 for(const e of incoming){
  const key=contactKey(e),old=entries.get(key);
  if(!old)entries.set(key,{...e});
  else entries.set(key,{...(e.timestamp<old.timestamp?e:old),consumed:old.consumed||e.consumed,outcome:e.outcome??old.outcome});
 }
 if(recap?.activityId===activity)for(const [key,e] of entries){
  if(e.kind==='outbreak'){
   const result=recap.encounters.find(r=>r.outbreakId===e.id);
   if(result)entries.set(key,{...e,outcome:{status:result.accepted?'confirmed':'rejected',text:result.accepted?`${result.visitPoints} visit points confirmed${result.cleanupPoints?` · ${result.cleanupPoints} cleanup points confirmed`:''}`:result.reason==='cooldown'?'Not awarded · revisit cooldown':result.reason==='duplicate'?'Counted from another recording':result.reason==='expired'?'Not awarded · outside the eligible window':'Not awarded · activity did not qualify'}});
  }else{
   const result=recap.labCollections?.find(r=>r.labId===e.id);
   if(result)entries.set(key,{...e,outcome:{status:result.status==='confirmed'?'confirmed':'rejected',text:result.status==='confirmed'?(result.resistanceReduction>0?'Collection confirmed · resistance restored':'Collection confirmed · no resistance restored'):result.status==='already-collected'?'Already collected by you':result.status==='expired'?'Not collected · expired':'Not collected · activity did not qualify'}});
  }
 }
 return [...entries.values()].sort((a,b)=>b.timestamp-a.timestamp||contactKey(a).localeCompare(contactKey(b)));
}

export function contactEntryText(e:ContactEntry,qualified:boolean){
 if(e.outcome)return e.outcome.text;
 if(e.kind==='lab')return `${e.offerFraction===undefined?'':`Offered up to ${e.offerFraction>0&&e.offerFraction<.005?'<1':Math.round(e.offerFraction*100)}% restoration · `}Collection provisional · confirms on upload`;
 if(e.reason==='cooldown')return 'No visit points estimated · revisit cooldown (local estimate)';
 if(!e.estimate)return 'No visit points estimated · awaiting validation';
 return qualified?`~${e.estimate} visit points · awaiting validation`:`~${e.estimate} visit points held · reach 500 m of eligible GPS coverage; then awaiting validation`;
}

export type Notice={entries:ContactEntry[];at:number};
export type ContactNotices={active:Notice|null;pending:Notice|null};
export const emptyNotices=():ContactNotices=>({active:null,pending:null});
export function enqueueContactNotice(state:ContactNotices,entries:ContactEntry[],now:number):ContactNotices{
 if(!entries.length)return state;
 const merged=mergeContactEntries(state.pending?.entries??[],entries,null,'');
 return {...state,pending:{entries:merged,at:state.pending?.at??Math.max(now+1000,state.active?.at??0)}};
}
export function advanceContactNotice(state:ContactNotices,now:number):ContactNotices{
 const active=state.active&&state.active.at>now?state.active:null;
 if(!active&&state.pending&&state.pending.at<=now)return {active:{entries:state.pending.entries,at:now+4000},pending:null};
 return active===state.active?state:{...state,active};
}
