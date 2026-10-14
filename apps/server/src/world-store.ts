import {tilePosition,cellKey} from './spatial/access.ts';
import {advanceSpatial} from './spatial/lifecycle.ts';
import type {AccessibleCell} from './spatial/access.ts';
import {captureFootprint} from './spatial/history.ts';
import type {Footprint} from '@sporeward/game';
import type {WorldPersistence} from './database/world.ts';
import {mkdir,readFile,writeFile,rename,open} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {BALANCE,createWorld,advanceWorld,applyVisit,matchContacts,nextVisit,pendingCleaning,type WorldState} from '@sporeward/game';
import type {ActivityChunk,ActivityReceipt,EncounterRecap,EncounterResult,WorldView} from '@sporeward/protocol';
import {tampereTestOutbreaks,type TestOutbreak} from './test-outbreaks.ts';
type Contribution={id:string;player:string;activityId:string;outbreakId:string;contactAt:number;visitPoints:number};
type SavedActivity={player:string;started:number;ended:number;results:EncounterResult[]};
export type Persisted={version:1;resetGeneration?:number;footprints?:Footprint[];spatialRuntime?:{density:number;sequence:number;nextSpawn:number};startedAt:number;fixtures:TestOutbreak[];engine:WorldState;contributions:Contribution[];bonuses:Record<string,string>;activities:Record<string,SavedActivity>};
/** Single-process test-world store. One atomic snapshot includes world effects,
 * source observations and rewards. A failed write leaves the previous state intact.
 * PostgreSQL transactions will replace this adapter for multiple server instances.
 */
export class WorldStore {
 private queue=Promise.resolve();
 constructor(private root:string,private now:()=>number=Date.now,private fixtures:()=>TestOutbreak[]=tampereTestOutbreaks,private options:{spatial?:AccessibleCell[];persistence?:WorldPersistence;seed?:number;allowSimulationReset?:boolean;contributionId?:(contact:{player:string;activityId:string;outbreakId:string;contactAt:number})=>string}={}) {}
 private async locked<T>(operation:(state:Persisted)=>Promise<T>):Promise<T> {
  const result=this.queue.then(async()=>{
   if(this.options.persistence)return this.options.persistence.transaction(()=>{
    const fixtures=this.fixtures();return {version:1,startedAt:Math.floor(this.now()/60000)*60000,fixtures,engine:createWorld({ids:fixtures.map(o=>o.id),seed:this.options.seed,effort:4,balance:this.options.spatial?{splitProbability:0}:{maximumCells:5,growthDurationMs:100*365*86400000,splitProbability:0}}),contributions:[],bonuses:{},activities:{}};
   },async state=>{
    this.capture(state);this.advance(state,Math.max(0,Math.floor((this.now()-state.startedAt)/60000)-state.engine.time));
    this.capture(state);this.settleBonuses(state);const value=await operation(state);this.settleBonuses(state);return value;
   });
   await mkdir(this.root,{recursive:true,mode:0o700});
   let state:Persisted;
   try{state=JSON.parse(await readFile(join(this.root,'world.json'),'utf8'));if(state.version!==1)throw new Error('Unsupported world snapshot.');}
   catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;
    const fixtures=this.fixtures();state={version:1,startedAt:Math.floor(this.now()/60000)*60000,fixtures,engine:createWorld({ids:fixtures.map(o=>o.id),seed:this.options.seed,effort:4,balance:this.options.spatial?{splitProbability:0}:{maximumCells:5,growthDurationMs:100*365*86400000,splitProbability:0}}),contributions:[],bonuses:{},activities:{}};
   }
   state.bonuses??={};
   this.capture(state);
   const minute=Math.max(0,Math.floor((this.now()-state.startedAt)/60000));
   this.advance(state,Math.max(0,minute-state.engine.time));
   this.capture(state);this.settleBonuses(state);
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
 resetForSimulation(){
  if(!this.options.allowSimulationReset)throw new Error('World reset is enabled only in the dedicated simulator.');
  return this.locked(async s=>{
   s.resetGeneration=(s.resetGeneration??0)+1;s.startedAt=Math.floor(this.now()/60000)*60000;s.fixtures=this.fixtures();
   s.engine=createWorld({ids:s.fixtures.map(f=>f.id),seed:this.options.seed,effort:4,balance:this.options.spatial?{splitProbability:0}:{maximumCells:5,growthDurationMs:100*365*86400000,splitProbability:0}});
   s.contributions=[];s.bonuses={};s.activities={};s.footprints=[];s.spatialRuntime=undefined;this.capture(s);return {startedAt:s.startedAt,outbreaks:s.fixtures.length};
  });
 }
 private advance(s:Persisted,minutes:number){if(this.options.spatial)advanceSpatial(s,minutes,this.options.spatial);else advanceWorld(s.engine,minutes);}
 private capture(s:Persisted){
  const existing=s.footprints!==undefined;s.footprints??=[];
  for(const f of s.fixtures){const target=s.engine.targets.find(o=>o.id===f.id);if(!target||f.retiredAt!==undefined)continue;
   const known=s.footprints.some(v=>v.id===f.id);
   captureFootprint(s.footprints,{id:f.id,ring:f.ring,validFrom:existing&&known?s.startedAt+s.engine.time*60000:s.startedAt,validUntil:target.cleared===null?null:s.startedAt+target.cleared*60000+s.engine.balance.cleanupProtectionMs});
  }
 }
 private key(player:string,id:string){return createHash('sha256').update(player+'\0'+id).digest('hex');}
 async view(player:string):Promise<WorldView> {
  return this.locked(async s=>({version:1,serverTime:this.now(),worldStartedAt:s.startedAt,outbreaks:s.fixtures.filter(f=>f.retiredAt===undefined&&(s.engine.targets.find(o=>o.id===f.id)?.cleared===null||this.now()<=s.startedAt+(s.engine.targets.find(o=>o.id===f.id)?.cleared??0)*60000+s.engine.balance.cleanupProtectionMs)).map(f=>{
   const o=s.engine.targets.find(o=>o.id===f.id)!,next=nextVisit(s.engine,o,player,(this.now()-s.startedAt)/60000),committed=pendingCleaning(o);
   return {id:o.id,name:f.name,ring:f.ring,spawnedAt:f.spawnedAt??s.startedAt,clearedAt:o.cleared===null?null:s.startedAt+o.cleared*60000,status:o.cleared!==null?'cleared':committed>=o.strength?'clearing':committed>0?'withering':'active',strength:o.strength,committedCleaning:committed,visitsRemaining:Math.max(0,Math.ceil((o.strength-committed)/next.power)),visitPoints:next.points,cleanupBonus:o.bonus,eligibleAt:o.history[player]?s.startedAt+o.history[player].last*60000+BALANCE.visitCooldownMs:0};
  })}));
 }
 async process(player:string,activity:ActivityChunk['activity'],fixes:ActivityChunk['fixes'],receipt:ActivityReceipt):Promise<EncounterRecap> {
  return this.locked(async s=>{
   const key=this.key(player,activity.id);
   if(!Object.hasOwn(s.activities,key)) {
    const footprints=s.footprints!;
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
       if(applied.accepted){
        if(f.cells){const fix=fixes.find(fix=>fix.timestamp>=contact.timestamp);if(fix){const [x,y]=tilePosition([fix.longitude,fix.latitude]),key=cellKey({x:Math.floor(x),y:Math.floor(y)});f.heat??={};f.heat[key]=(f.heat[key]??0)+applied.power;}}
        const id=this.options.contributionId?.({player,activityId:activity.id,outbreakId:f.id,contactAt:contact.timestamp})??randomUUID();result.contributionId=id;s.contributions.push({id,player,activityId:activity.id,outbreakId:f.id,contactAt:contact.timestamp,visitPoints:applied.points});}
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
