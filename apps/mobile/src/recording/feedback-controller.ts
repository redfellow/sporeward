import {matchContacts} from '@sporeward/game';
import type {EncounterRecap,WorldView,FieldLabOffer} from '@sporeward/protocol';
import type {Fix} from './model';
import type {ContactPreview} from './encounters';
import {contactKey,mergeContactEntries,type ContactEntry} from './contact-feedback';

export function contactEvidence(world:WorldView|null,observations:ContactPreview[],fixes:Fix[],outing?:string,offer?:FieldLabOffer|null):ContactEntry[]{
 if(!world)return [];
 const entries:ContactEntry[]=[];
 for(const c of observations){
  const o=world.outbreaks.find(o=>o.id===c.outbreakId);
  if(!o||c.timestamp<Math.max(world.worldStartedAt,o.spawnedAt))continue;
  entries.push({kind:'outbreak',id:o.id,name:o.name,timestamp:c.timestamp,estimate:c.visitPoints,reason:c.visitPoints===0&&c.timestamp<o.eligibleAt?'cooldown':'unknown',consumed:true});
 }
 const labs=(world.fieldLabs??[]).filter(l=>!l.collected),contacts=matchContacts(fixes,labs.map(l=>({id:l.id,ring:l.ring,validFrom:Math.max(world.worldStartedAt,l.spawnedAt),validUntil:l.expiresAt})));
 const quotes=offer?.outingId===outing&&offer?.worldStartedAt===world.worldStartedAt&&offer.expiresAt>world.serverTime?new Map(offer.labs.map(l=>[l.labId,l.fraction])):null;
 for(const c of contacts){const l=labs.find(l=>l.id===c.outbreakId)!;entries.push({kind:'lab',id:l.id,name:l.name,timestamp:c.timestamp,estimate:null,reason:'unknown',consumed:true,...(quotes?.has(l.id)?{offerFraction:quotes.get(l.id)}:{})});}
 return entries;
}

type Input={entries:ContactEntry[];recap:EncounterRecap|null;latestFix:number;worldReady:boolean;now:number};
type IO={load:()=>Promise<ContactEntry[]>;save:(entries:ContactEntry[])=>Promise<ContactEntry[]>};
/** Serializes hydration and persistence, and makes live versus catch-up a tested decision. */
export class ContactFeedbackController{
 private rows:ContactEntry[]=[];private loaded=false;private initialized=false;private hadWorld=false;
 private watermark=0;private allowed=false;private since=Infinity;private disposed=false;
 private queue:Promise<unknown>=Promise.resolve();
 constructor(private activity:string,private io:IO,private onRows:(rows:ContactEntry[])=>void,private onFresh:(rows:ContactEntry[])=>void){}
 gate(allowed:boolean,now:number){if(allowed&&!this.allowed)this.since=now;this.allowed=allowed;}
 dispose(){this.disposed=true;this.allowed=false;}
 update(input:Input):Promise<void>{
  // Capture visibility when evidence arrives as well as when the write completes.
  const allowed=this.allowed,since=this.since;
  const run=async()=>{
   if(this.disposed)return;
   if(!this.loaded){this.rows=await this.io.load();if(this.disposed)return;this.loaded=true;}
   const live=allowed&&this.initialized&&this.hadWorld&&input.worldReady;
   const fresh=new Set(input.entries.filter(e=>live&&!e.outcome&&e.timestamp>this.watermark&&e.timestamp>=since).map(contactKey));
   const incoming=input.entries.map(e=>({...e,reason:fresh.has(contactKey(e))?e.reason:'unknown' as const,consumed:true}));
   const next=mergeContactEntries(this.rows,incoming,input.recap,this.activity);
   const old=new Map(this.rows.map(e=>[contactKey(e),JSON.stringify(e)]));
   const changed=next.filter(e=>old.get(contactKey(e))!==JSON.stringify(e));
   const claimed=changed.length?await this.io.save(changed):[];
   if(this.disposed)return;
   this.watermark=Math.max(this.watermark,input.latestFix);this.initialized=true;this.hadWorld=input.worldReady;
   this.rows=next;this.onRows(next);
   if(this.allowed){const notices=claimed.filter(e=>fresh.has(contactKey(e))&&e.timestamp>=this.since);if(notices.length)this.onFresh(notices);}
  };
  const next=this.queue.then(run);this.queue=next.catch(()=>{});return next;
 }
}
