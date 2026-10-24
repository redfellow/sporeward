import {landContour,type WaterPolygon} from './spatial/water.ts';
import {resizeOutbreak} from './spatial/resize.ts';
import {contour} from './spatial/contour.ts';
import {canonicalContour} from './spatial/continuous.ts';
import {separatedContour} from './spatial/separation.ts';
import {outbreakView} from './outbreak-view.ts';
import {personalVisitPoints,personalResistanceView,recordPersonalContribution,representativePoint,type PersonalResistance} from './resistance-state.ts';
import {advanceFieldLabs,type LabLifecycle} from './field-labs.ts';
import {issueLabOffer,settleLabContact,labViews} from './lab-settlement.ts';
import {generateOutbreaks} from './spatial/generate.ts';
import {cellKey as spatialCellKey} from './spatial/access.ts';
import {createOutbreak} from '@sporeward/game';
import {tilePosition,cellKey} from './spatial/access.ts';
import {advanceSpatial} from './spatial/lifecycle.ts';
import {SPATIAL_BALANCE,type SpatialBalance} from '@sporeward/game';
import type {AccessibleCell} from './spatial/access.ts';
import {captureFootprint} from './spatial/history.ts';
import type {Footprint} from '@sporeward/game';
import type {WorldPersistence} from './database/world.ts';
import {mkdir,readFile,writeFile,rename,open} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {BALANCE,reconcileCleanupBonuses,createWorld,advanceWorld,applyVisit,matchContacts,pendingCleaning,type WorldState} from '@sporeward/game';
import type {ActivityChunk,ActivityReceipt,ActivityFootprints,EncounterRecap,EncounterResult,WorldView,FieldLabOffer,LabCollectionResult} from '@sporeward/protocol';
import {tampereTestOutbreaks,type TestOutbreak} from './test-outbreaks.ts';
type Contribution={id:string;player:string;activityId:string;outbreakId:string;contactAt:number;visitPoints:number;scoringVersion?:2};
type SavedActivity={player:string;started:number;ended:number;results:EncounterResult[];labCollections?:LabCollectionResult[]};
export type Persisted={version:1;resistance?:PersonalResistance;fieldLabs?:LabLifecycle;labOffers?:Record<string,FieldLabOffer>;labCollections?:Record<string,LabCollectionResult>;contourVersion?:3|4|5;coverageExpansions?:string[];resetGeneration?:number;spatialUpgrade?:{version:1;at:number};footprints?:Footprint[];spatialBalance?:SpatialBalance;spatialRuntime?:{density:number;sequence:number;nextSpawn:number};startedAt:number;fixtures:TestOutbreak[];engine:WorldState;contributions:Contribution[];bonuses:Record<string,string>;activities:Record<string,SavedActivity>};
/** Single-process test-world store. One atomic snapshot includes world effects,
 * source observations and rewards. A failed write leaves the previous state intact.
 * PostgreSQL transactions will replace this adapter for multiple server instances.
 */
export class WorldStore {
 private queue=Promise.resolve();
 constructor(private root:string,private now:()=>number=Date.now,private fixtures:()=>TestOutbreak[]=tampereTestOutbreaks,private options:{spatial?:AccessibleCell[];labAccess?:AccessibleCell[];spatialBalance?:Partial<SpatialBalance>;persistence?:WorldPersistence;seed?:number;density?:number;allowSimulationReset?:boolean;contributionId?:(contact:{player:string;activityId:string;outbreakId:string;contactAt:number})=>string}={}) {}
 private async locked<T>(operation:(state:Persisted)=>Promise<T>):Promise<T> {
  const result=this.queue.then(async()=>{
   if(this.options.persistence){
    // Checkpoint offline catch-up in bounded simulated-hour transactions. Each
    // commit archives transitions and drops expired rings from the next snapshot.
    for(;;){
     const outcome=await this.options.persistence.transaction(()=>{
      const fixtures=this.fixtures();return {version:1,startedAt:Math.floor(this.now()/60000)*60000,fixtures,engine:createWorld({ids:fixtures.map(o=>o.id),seed:this.options.seed,effort:4,balance:this.options.spatial?{splitProbability:0}:{maximumCells:5,growthDurationMs:100*365*86400000,splitProbability:0}}),contributions:[],bonuses:{},activities:{}};
     },async state=>{
      this.capture(state);
      const remaining=Math.max(0,Math.floor((this.now()-state.startedAt)/60000)-state.engine.time),step=Math.min(60,remaining);
      this.advance(state,step);this.capture(state);this.settleBonuses(state);
      if(remaining>step)return {complete:false as const};
      const value=await operation(state);this.settleBonuses(state);return {complete:true as const,value};
     });
     if(outcome.complete)return outcome.value;
    }
   }
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
   s.resistance=undefined;s.fieldLabs=undefined;s.labOffers=undefined;s.labCollections=undefined;s.contributions=[];s.bonuses={};s.activities={};s.footprints=[];s.spatialRuntime=undefined;s.spatialBalance=undefined;s.spatialUpgrade=undefined;this.capture(s);return {startedAt:s.startedAt,outbreaks:s.fixtures.length};
  });
 }
 /** Explicit prospective activation; no backfill and no historical score changes. */
 async configureResistance(enabled:boolean) {
  return this.locked(async s=>{
   if(!s.resistance&&enabled)s.resistance={version:1,activatedAt:this.now(),enabled:true,players:{},representatives:{}};
   if(s.resistance)s.resistance.enabled=enabled;
   return {enabled:s.resistance?.enabled??false,activatedAt:s.resistance?.activatedAt??null};
  });
 }
 async prepareFieldLabs() {
  const access=this.options.labAccess??this.options.spatial;
  if(!access)throw new Error('Field Labs require a public access map.');
  return this.locked(async s=>{
   s.fieldLabs=advanceFieldLabs(s.fieldLabs,access,this.options.seed??73,s.startedAt,this.now());
   return {labs:s.fieldLabs.labs.length};
  });
 }
 async labOffer(player:string,outingId:string) {
  if(!/^[A-Za-z0-9-]{1,100}$/.test(outingId))throw Object.assign(new Error('Invalid outing ID.'),{statusCode:400});
  return this.locked(async s=>issueLabOffer(s,player,outingId,this.now()));
 }
 /** Upgrade current silhouettes once; old footprint intervals remain matchable. */
 async prepareOrganicContours(){
  if(!this.options.spatial)return;
  return this.locked(async s=>{
   if((s.contourVersion??3)>=4)return {alreadyPrepared:true};
   const now=this.now();let changed=0;
   const targets=new Map(s.engine.targets.map(o=>[o.id,o]));
   const occupied=s.fixtures.filter(f=>{const o=targets.get(f.id);return f.retiredAt===undefined&&o&&(o.cleared===null||now<=s.startedAt+o.cleared*60000+s.engine.balance.cleanupProtectionMs);});
   for(const f of s.fixtures){
    const target=targets.get(f.id);
    if(!f.cells||f.retiredAt!==undefined||!target||target.cleared!==null)continue;
    f.surface??=canonicalContour(f.id);
    const ring=separatedContour(contour(f.cells,f.partial,f.id,4,f.surface),occupied.filter(other=>other!==f).map(other=>other.ring));
    if(!ring)continue;
    if(JSON.stringify(ring)===JSON.stringify(f.ring))continue;
    f.ring=ring;captureFootprint(s.footprints!,{id:f.id,ring,validFrom:now,validUntil:null});changed++;
   }
   s.contourVersion=4;return {alreadyPrepared:false,changed};
  });
 }
 /** Advance under the old profile first; shoreline changes begin at this instant only. */
 async prepareShorelines(water?:WaterPolygon[]){
  if(!this.options.spatial)return;
  return this.locked(async s=>{
   if(s.contourVersion===5)return {alreadyPrepared:true};
   const now=this.now(),access=this.options.spatial!,targets=new Map(s.engine.targets.map(t=>[t.id,t]));let changed=0,relocated=0;
   for(const f of s.fixtures){
    const target=targets.get(f.id);if(!f.cells||f.retiredAt!==undefined||!target||target.cleared!==null&&now>s.startedAt+target.cleared*60000+s.engine.balance.cleanupProtectionMs)continue;
    let ring=landContour(f.ring,water);
    if(!ring){
     const origin=f.cells[0],others=s.fixtures.filter(o=>o!==f&&o.retiredAt===undefined&&targets.get(o.id)?.cleared===null),blocked=new Set(others.flatMap(o=>(o.cells??[]).map(spatialCellKey)));
     const nearby=[...access].sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y)).slice(0,600);
     let seed=2166136261;for(const c of f.id)seed=Math.imul(seed^c.charCodeAt(0),16777619);
     const replacement=generateOutbreaks(nearby,seed>>>0,1,blocked,5,others.map(o=>o.ring))[0];
     const resized=resizeOutbreak({...replacement,id:f.id},Math.max(1/32,target.cells),access,blocked,new Map(),5);
     ring=separatedContour(resized.ring,others.map(o=>o.ring));if(!ring)throw new Error('Cannot relocate a water-bound outbreak to separate accessible land.');
     f.cells=resized.cells;f.partial=resized.partial;f.surface=resized.surface;relocated++;
    }
    if(JSON.stringify(ring)!==JSON.stringify(f.ring)){f.ring=ring;captureFootprint(s.footprints!,{id:f.id,ring,validFrom:now,validUntil:target.cleared===null?null:s.startedAt+target.cleared*60000+s.engine.balance.cleanupProtectionMs});changed++;}
   }
   s.contourVersion=5;return {alreadyPrepared:false,changed,relocated};
  });
 }
 async prepareSpatialWorld(){
  if(!this.options.spatial)throw new Error('Spatial access data is required.');
  return this.locked(async s=>{
   if(s.spatialUpgrade)return {alreadyPrepared:true,outbreaks:s.fixtures.filter(f=>f.retiredAt===undefined).length};
   const prototypes=tampereTestOutbreaks(),now=s.startedAt+s.engine.time*60000;
   for(const f of s.fixtures){if(!f.cells){const prototype=prototypes.find(p=>p.id===f.id);if(!prototype?.cells)throw new Error('Unknown legacy outbreak geometry; migration stopped.');f.cells=prototype.cells.map(c=>({...c}));}}
   s.engine.balance={...s.engine.balance,maximumCells:BALANCE.maximumCells,growthDurationMs:BALANCE.growthDurationMs,splitProbability:0};
   for(const o of s.engine.targets)if(!o.remnant&&o.cleared===null){o.cap=BALANCE.maximumCells;const spawned=s.fixtures.find(f=>f.id===o.id)?.spawnedAt??s.startedAt;o.deadline=Math.max(s.engine.time+s.engine.balance.disintegrationDurationMs/60000,(spawned-s.startedAt+s.engine.balance.growthDurationMs+s.engine.balance.disintegrationDurationMs)/60000+o.extension);}
   const density=this.options.density??20;if(!Number.isInteger(density)||density<1||density>1000)throw new Error('Invalid spatial density.');
   const live=s.engine.targets.filter(o=>!o.remnant&&o.cleared===null),needed=Math.max(0,density-live.length);
   const occupied=new Set(s.fixtures.filter(f=>{const o=s.engine.targets.find(o=>o.id===f.id);return f.retiredAt===undefined&&o&&(o.cleared===null||s.engine.time<=o.cleared+s.engine.balance.cleanupProtectionMs/60000);}).flatMap(f=>(f.cells??[]).map(spatialCellKey)));
   if(needed){for(const f of generateOutbreaks(this.options.spatial!,this.options.seed??73,needed,occupied,s.contourVersion??3,s.fixtures.filter(f=>f.retiredAt===undefined).map(f=>f.ring))){
    if(s.engine.targets.some(o=>o.id===f.id))throw new Error('Spatial migration outbreak identity collision.');
    const o=createOutbreak(f.id,s.engine.effort,s.engine.balance);o.deadline+=s.engine.time;s.engine.targets.push(o);s.fixtures.push({...f,spawnedAt:now});
    s.footprints??=[];captureFootprint(s.footprints,{id:f.id,ring:f.ring,validFrom:now,validUntil:null});
   }}
   s.spatialBalance??={...SPATIAL_BALANCE,...this.options.spatialBalance};s.spatialRuntime={density,sequence:0,nextSpawn:s.engine.time+s.spatialBalance.replacementInitialDelayMs/60000};s.spatialUpgrade={version:1,at:now};
   return {alreadyPrepared:false,outbreaks:live.length+needed};
  });
 }
 private advance(s:Persisted,minutes:number){if(s.fieldLabs&&(this.options.labAccess??this.options.spatial))s.fieldLabs=advanceFieldLabs(s.fieldLabs,(this.options.labAccess??this.options.spatial)!,this.options.seed??73,s.startedAt,this.now());if(this.options.spatial){s.spatialBalance??={...SPATIAL_BALANCE,...this.options.spatialBalance};advanceSpatial(s,minutes,this.options.spatial);}else advanceWorld(s.engine,minutes);}
 private capture(s:Persisted){
  const existing=s.footprints!==undefined;s.footprints??=[];
  for(const f of s.fixtures){const target=s.engine.targets.find(o=>o.id===f.id);if(!target||f.retiredAt!==undefined||target.cleared!==null&&s.engine.time>target.cleared+s.engine.balance.cleanupProtectionMs/60000)continue;
   const known=s.footprints.some(v=>v.id===f.id);
   captureFootprint(s.footprints,{id:f.id,ring:f.ring,validFrom:existing&&known?s.startedAt+s.engine.time*60000:s.startedAt,validUntil:target.cleared===null?null:s.startedAt+target.cleared*60000+s.engine.balance.cleanupProtectionMs});
  }
 }
 private key(player:string,id:string){return createHash('sha256').update(player+'\0'+id).digest('hex');}
 async view(player:string):Promise<WorldView> {
  return this.locked(async s=>({version:1,serverTime:this.now(),worldStartedAt:s.startedAt,...(s.fieldLabs?{fieldLabs:labViews(s,player,this.now())}:{}),...(s.resistance?.enabled?{resistance:personalResistanceView(s.resistance,player,this.now())}:{}),outbreaks:s.fixtures.filter(f=>f.retiredAt===undefined&&(s.engine.targets.find(o=>o.id===f.id)?.cleared===null||this.now()<=s.startedAt+(s.engine.targets.find(o=>o.id===f.id)?.cleared??0)*60000+s.engine.balance.cleanupProtectionMs)).map(f=>{
   const view=outbreakView(s.engine,s.engine.targets.find(o=>o.id===f.id)!,f,player,s.startedAt,this.now());
   if(s.resistance?.enabled&&view.clearedAt===null&&view.lifecycle!=='remnant'){
    view.visitPoints=personalVisitPoints(s.resistance,player,representativePoint(s.resistance,f),this.now(),s.engine.balance.firstVisitPoints);view.scoringVersion=2;
   }
   return view;
  })}));
 }
 async process(player:string,activity:ActivityChunk['activity'],fixes:ActivityChunk['fixes'],receipt:ActivityReceipt):Promise<EncounterRecap> {
  return this.locked(async s=>{
   const key=this.key(player,activity.id);
   if(!Object.hasOwn(s.activities,key)) {
    let footprints=s.footprints!;
    if(receipt.eligibleForGame&&fixes.length&&this.options.persistence?.historicalFootprints){
     const archived=await this.options.persistence.historicalFootprints(fixes[0].timestamp,fixes.at(-1)!.timestamp);
     // Catch-up may have just closed/replaced an interval that is still open
     // in the committed archive. The transaction's current intervals win.
     const merged=new Map(footprints.map(f=>[f.id+':'+f.validFrom,f]));
     for(const f of archived)if(!merged.has(f.id+':'+f.validFrom))merged.set(f.id+':'+f.validFrom,f);
     footprints=[...merged.values()];
    }
    const ordinary=matchContacts(fixes,footprints).map(contact=>({...contact,kind:'outbreak' as const}));
    const labContacts=matchContacts(fixes,(s.fieldLabs?.labs??[]).map(lab=>({id:lab.id,ring:lab.ring,validFrom:lab.spawnedAt,validUntil:null}))).map(contact=>({...contact,kind:'lab' as const}));
    const contacts=[...ordinary,...labContacts].sort((a,b)=>a.timestamp-b.timestamp||a.outbreakId.localeCompare(b.outbreakId)),results:EncounterResult[]=[],labCollections:LabCollectionResult[]=[];
    for(const contact of contacts) {
     if(contact.kind==='lab'){
      const lab=s.fieldLabs!.labs.find(lab=>lab.id===contact.outbreakId)!;
      labCollections.push(settleLabContact(s,player,activity.id,lab,contact.timestamp,receipt.eligibleForGame&&this.now()-activity.ended<=86400000,this.now()));continue;
     }
     const f=s.fixtures.find(o=>o.id===contact.outbreakId)!,o=s.engine.targets.find(o=>o.id===f.id)!;
     const result:EncounterResult={outbreakId:f.id,name:f.name,contactAt:contact.timestamp,visitPoints:0,cleanupPoints:0,accepted:false,reason:'ineligible',contributionId:null};
     if(receipt.eligibleForGame) {
      const previous=s.contributions.filter(v=>v.player===player&&v.outbreakId===f.id&&Math.abs(v.contactAt-contact.timestamp)<s.engine.balance.visitCooldownMs).sort((a,b)=>a.contactAt-b.contactAt)[0];
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
        if(f.retiredAt===undefined)reconcileCleanupBonuses(s.engine,o);
       }
      } else {
       const resistance=s.resistance?.enabled&&contact.timestamp>=s.resistance.activatedAt?s.resistance:undefined;
       const point=resistance?representativePoint(resistance,f):undefined;
       const ordinaryVisitPoints=resistance&&point?personalVisitPoints(resistance,player,point,contact.timestamp,s.engine.balance.firstVisitPoints):undefined;
       const applied=applyVisit(s.engine,f.id,player,{contactTime:(contact.timestamp-s.startedAt)/60000,historicalOnly:f.retiredAt!==undefined,ordinaryVisitPoints});
       result.accepted=applied.accepted;result.reason=applied.accepted?'accepted':applied.reason==='expired'?'expired':'cooldown';result.visitPoints=applied.points;if(applied.accepted&&resistance)result.scoringVersion=2;
       if(applied.accepted){
        if(f.cells){const fix=fixes.find(fix=>fix.timestamp>=contact.timestamp);if(fix){const [x,y]=tilePosition([fix.longitude,fix.latitude]),key=cellKey({x:Math.floor(x),y:Math.floor(y)});f.heat??={};f.heat[key]=(f.heat[key]??0)+applied.power;}}
        const id=this.options.contributionId?.({player,activityId:activity.id,outbreakId:f.id,contactAt:contact.timestamp})??randomUUID();result.contributionId=id;s.contributions.push({id,player,activityId:activity.id,outbreakId:f.id,contactAt:contact.timestamp,visitPoints:applied.points,...(resistance?{scoringVersion:2 as const}:{})});
        if(resistance&&point)recordPersonalContribution(resistance,player,id,contact.timestamp,point,applied.power);
       }
      }
     }
     results.push(result);
    }
    Object.defineProperty(s.activities,key,{value:{player,started:activity.started,ended:activity.ended,results,...(s.fieldLabs?{labCollections}:{})},enumerable:true,writable:true,configurable:true});
   }
   return this.recap(s,player,activity.id);
  });
 }
 async tick(){return this.locked(async s=>({time:s.engine.time,outbreaks:s.fixtures.length}));}
 async standings(){return this.locked(async s=>Object.entries(s.engine.scores).map(([playerId,points])=>({playerId,points})).sort((a,b)=>b.points-a.points||a.playerId.localeCompare(b.playerId)).slice(0,1000));}
 async activity(player:string,id:string):Promise<EncounterRecap|null> {return this.locked(async s=>Object.hasOwn(s.activities,this.key(player,id))?this.recap(s,player,id):null);}
 async activityFootprints(player:string,id:string):Promise<ActivityFootprints|null> {
  return this.locked(async s=>{
   const activity=s.activities[this.key(player,id)];if(!activity)return null;
   const contacts=activity.results.map(({outbreakId,contactAt})=>({outbreakId,contactAt}));if(!contacts.length)return {activityId:id,footprints:[]};
   const from=Math.min(...contacts.map(c=>c.contactAt)),until=Math.max(...contacts.map(c=>c.contactAt));
   const archived=await this.options.persistence?.historicalFootprints?.(from,until)??[];
   const footprints=[...(s.footprints??[]),...archived],byContact=new Map<string,Footprint>();
   for(const contact of contacts){
    const matching=footprints.filter(f=>f.id===contact.outbreakId&&f.validFrom<=contact.contactAt&&(f.validUntil===null||f.validUntil>contact.contactAt)).sort((a,b)=>b.validFrom-a.validFrom)[0];
    if(matching)byContact.set(`${contact.outbreakId}:${contact.contactAt}`,matching);
   }
   return {activityId:id,footprints:contacts.flatMap(contact=>{const match=byContact.get(`${contact.outbreakId}:${contact.contactAt}`);return match?[{outbreakId:contact.outbreakId,contactAt:contact.contactAt,ring:match.ring.map(([x,y])=>[x,y] as [number,number])}]:[]})};
  });
 }
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
  return {activityId:id,confirmedVisitPoints:results.reduce((n,e)=>n+e.visitPoints,0),confirmedCleanupPoints:results.reduce((n,e)=>n+e.cleanupPoints,0),pendingCleanupPoints:pending,encounters:results,updatedAt:this.now(),...(activity.labCollections?{labCollections:activity.labCollections}:{})};
 }
}
