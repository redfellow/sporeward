import {mkdir,readFile,writeFile,rename,open} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {BALANCE,createWorld,advanceWorld,applyVisit,matchContacts,nextVisit,pendingCleaning,type WorldState} from '@sporeward/game';
import type {ActivityChunk,ActivityReceipt,EncounterRecap,EncounterResult,WorldView} from '@sporeward/protocol';
import {tampereTestOutbreaks,type TestOutbreak} from './test-outbreaks.ts';
type Contribution={id:string;player:string;activityId:string;outbreakId:string;contactAt:number;visitPoints:number};
type SavedActivity={player:string;started:number;ended:number;results:EncounterResult[]};
type Persisted={version:1;startedAt:number;fixtures:TestOutbreak[];engine:WorldState;contributions:Contribution[];bonuses:Record<string,string>;activities:Record<string,SavedActivity>};
/** Single-process test-world store. One atomic snapshot includes world effects,
 * source observations and rewards. A failed write leaves the previous state intact.
 * PostgreSQL transactions will replace this adapter for multiple server instances.
 */
export class WorldStore {
 private queue=Promise.resolve();
 constructor(private root:string,private now:()=>number=Date.now,private fixtures:()=>TestOutbreak[]=tampereTestOutbreaks) {}
 private async locked<T>(operation:(state:Persisted)=>Promise<T>):Promise<T> {
  const result=this.queue.then(async()=>{
   await mkdir(this.root,{recursive:true,mode:0o700});
   let state:Persisted;
   try{state=JSON.parse(await readFile(join(this.root,'world.json'),'utf8'));if(state.version!==1)throw new Error('Unsupported world snapshot.');}
   catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;
    const fixtures=this.fixtures();state={version:1,startedAt:Math.floor(this.now()/60000)*60000,fixtures,engine:createWorld({ids:fixtures.map(o=>o.id),effort:4,balance:{maximumCells:5,growthDurationMs:100*365*86400000,splitProbability:0}}),contributions:[],bonuses:{},activities:{}};
   }
   state.bonuses??={};
   const minute=Math.max(0,Math.floor((this.now()-state.startedAt)/60000));
   advanceWorld(state.engine,Math.max(0,minute-state.engine.time));
   this.settleBonuses(state);
   const value=await operation(state);
   this.settleBonuses(state);
   const temporary=join(this.root,randomUUID()+'.tmp'),destination=join(this.root,'world.json');
   await writeFile(temporary,JSON.stringify(state),{mode:0o600});
   const file=await open(temporary,'r');try{await file.sync();}finally{await file.close();}
   await rename(temporary,destination);
   const directory=await open(this.root,'r');try{await directory.sync();}finally{await directory.close();}
   return value;
  });
  this.queue=result.then(()=>{},()=>{});return result;
 }
 private key(player:string,id:string){return createHash('sha256').update(player+'\0'+id).digest('hex');}
 async view(player:string):Promise<WorldView> {
  return this.locked(async s=>({version:1,serverTime:this.now(),worldStartedAt:s.startedAt,outbreaks:s.fixtures.map(f=>{
   const o=s.engine.targets.find(o=>o.id===f.id)!,next=nextVisit(s.engine,o,player,(this.now()-s.startedAt)/60000),committed=pendingCleaning(o);
   return {id:o.id,name:f.name,ring:f.ring,spawnedAt:s.startedAt,clearedAt:o.cleared===null?null:s.startedAt+o.cleared*60000,status:o.cleared!==null?'cleared':committed>=o.strength?'clearing':committed>0?'withering':'active',strength:o.strength,committedCleaning:committed,visitsRemaining:Math.max(0,Math.ceil((o.strength-committed)/next.power)),visitPoints:next.points,cleanupBonus:o.bonus,eligibleAt:o.history[player]?s.startedAt+o.history[player].last*60000+BALANCE.visitCooldownMs:0};
  })}));
 }
 async process(player:string,activity:ActivityChunk['activity'],fixes:ActivityChunk['fixes'],receipt:ActivityReceipt):Promise<EncounterRecap> {
  return this.locked(async s=>{
   const key=this.key(player,activity.id);
   if(!Object.hasOwn(s.activities,key)) {
    const footprints=s.fixtures.map(f=>{const o=s.engine.targets.find(o=>o.id===f.id)!;return {id:f.id,ring:f.ring,validFrom:s.startedAt,validUntil:o.cleared===null?null:s.startedAt+o.cleared*60000+BALANCE.cleanupProtectionMs};});
    const contacts=matchContacts(fixes,footprints),results:EncounterResult[]=[];
    for(const contact of contacts) {
     const f=s.fixtures.find(o=>o.id===contact.outbreakId)!,o=s.engine.targets.find(o=>o.id===f.id)!;
     const result:EncounterResult={outbreakId:f.id,name:f.name,contactAt:contact.timestamp,visitPoints:0,cleanupPoints:0,accepted:false,reason:'ineligible',contributionId:null};
     if(receipt.eligibleForGame) {
      const previous=s.contributions.filter(v=>v.player===player&&v.outbreakId===f.id&&Math.abs(v.contactAt-contact.timestamp)<BALANCE.visitCooldownMs).sort((a,b)=>a.contactAt-b.contactAt)[0];
      if(previous) {
       const source=s.activities[this.key(player,previous.activityId)];
       const overlap=source&&activity.started<=source.ended&&activity.ended>=source.started;
       result.reason=overlap?'duplicate':'cooldown';result.contributionId=previous.id;
       // An overlapping source may supply an earlier first touch. Keep one effect/reward.
       if(overlap&&contact.timestamp<previous.contactAt) {
        const old=(previous.contactAt-s.startedAt)/60000,newTime=(contact.timestamp-s.startedAt)/60000;
        previous.contactAt=contact.timestamp;
        if(o.history[player]?.last===old)o.history[player].last=newTime;
        const visit=o.visits.find(v=>v.player===player&&v.time===old);if(visit)visit.time=newTime;
       }
      } else {
       const applied=applyVisit(s.engine,f.id,player,{contactTime:(contact.timestamp-s.startedAt)/60000});
       result.accepted=applied.accepted;result.reason=applied.accepted?'accepted':applied.reason==='expired'?'expired':'cooldown';result.visitPoints=applied.points;
       if(applied.accepted){const id=randomUUID();result.contributionId=id;s.contributions.push({id,player,activityId:activity.id,outbreakId:f.id,contactAt:contact.timestamp,visitPoints:applied.points});}
      }
     }
     results.push(result);
    }
    Object.defineProperty(s.activities,key,{value:{player,started:activity.started,ended:activity.ended,results},enumerable:true,writable:true,configurable:true});
   }
   return this.recap(s,player,activity.id);
  });
 }
 async activity(player:string,id:string):Promise<EncounterRecap|null> {return this.locked(async s=>Object.hasOwn(s.activities,this.key(player,id))?this.recap(s,player,id):null);}
 private settleBonuses(s:Persisted) {
  for(const o of s.engine.targets)for(const player of o.awarded) {
   const key=this.key(player,o.id);if(Object.hasOwn(s.bonuses,key))continue;
   const contribution=s.contributions.filter(v=>v.player===player&&v.outbreakId===o.id).sort((a,b)=>b.contactAt-a.contactAt)[0];
   if(contribution)s.bonuses[key]=contribution.id;
  }
 }
 private recap(s:Persisted,player:string,id:string):EncounterRecap {
  this.settleBonuses(s);
  const activity=s.activities[this.key(player,id)],results=activity.results.map(e=>({...e}));let pending=0;
  for(const e of results) {
   const o=s.engine.targets.find(o=>o.id===e.outbreakId)!;
   // One cleanup award per player/outbreak, attributed to their latest accepted source.
   const last=s.contributions.filter(v=>v.player===player&&v.outbreakId===o.id).sort((a,b)=>b.contactAt-a.contactAt)[0];
   if(e.accepted&&s.bonuses[this.key(player,o.id)]===e.contributionId)e.cleanupPoints=o.bonus;
   else if(e.accepted&&last?.id===e.contributionId) {
    if(o.cleared===null&&pendingCleaning(o)>=o.strength&&o.visits.every(v=>v.time<=(last.contactAt-s.startedAt)/60000+BALANCE.cleanupProtectionMs/60000))pending+=o.bonus;
   }
  }
  return {activityId:id,confirmedVisitPoints:results.reduce((n,e)=>n+e.visitPoints,0),confirmedCleanupPoints:results.reduce((n,e)=>n+e.cleanupPoints,0),pendingCleanupPoints:pending,encounters:results,updatedAt:this.now()};
 }
}
