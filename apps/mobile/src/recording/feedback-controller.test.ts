import {describe,it,expect} from 'vitest';
import {ContactFeedbackController,contactEvidence} from './feedback-controller';
import {contactKey,mergeContactEntries,type ContactEntry} from './contact-feedback';
import type {WorldView,EncounterRecap,FieldLabOffer} from '@sporeward/protocol';
const entry=(id:string,timestamp:number):ContactEntry=>({kind:'outbreak',id,name:id,timestamp,estimate:70,reason:'unknown',consumed:true});
function harness(){
 let saved:ContactEntry[]=[];const fresh:ContactEntry[][]=[],views:ContactEntry[][]=[];
 const io={load:async()=>saved,save:async(rows:ContactEntry[])=>{const keys=new Set(saved.filter(e=>e.consumed).map(contactKey));saved=mergeContactEntries(saved,rows,null,'outing');return rows.filter(e=>!keys.has(contactKey(e)));}};
 const create=()=>new ContactFeedbackController('outing',io,r=>views.push(r),r=>fresh.push(r));
 return {fresh,views,io,create,read:()=>saved};
}
const input=(entries:ContactEntry[],latestFix:number,worldReady=true,recap:EncounterRecap|null=null)=>({entries,latestFix,worldReady,now:latestFix,recap});
describe('contact feedback ingestion lifecycle',()=>{
 it('hydrates silently, announces new evidence once, and does not repeat on remount or changed snapshots',async()=>{
  const h=harness(),c=h.create();c.gate(true,1000);
  await c.update(input([entry('old',500)],1000));expect(h.fresh).toEqual([]);
  await c.update(input([entry('old',500),entry('new',2000)],2000));expect(h.fresh.flat().map(e=>e.id)).toEqual(['new']);
  await c.update(input([entry('new',2000)],3000));expect(h.read()).toHaveLength(2);expect(h.fresh).toHaveLength(1);
  c.dispose();const restored=h.create();restored.gate(true,4000);await restored.update(input([entry('new',2000)],4000));expect(h.fresh).toHaveLength(1);
 });
 it('keeps paused/hidden and foreground catch-up contacts quiet and resumes only fresh contacts',async()=>{
  const h=harness(),c=h.create();c.gate(true,1000);await c.update(input([],1000));
  c.gate(false,1500);await c.update(input([entry('paused',2000)],2000));
  c.gate(true,4000);await c.update(input([entry('screen-off',3000)],4000));expect(h.fresh).toEqual([]);
  await c.update(input([entry('live',5000)],5000));expect(h.fresh.flat().map(e=>e.id)).toEqual(['live']);
  expect(h.read().map(e=>e.id)).toEqual(['live','screen-off','paused']);
 });
 it('treats delayed world loading as reconstruction rather than a new crossing',async()=>{
  const h=harness(),c=h.create();c.gate(true,1000);
  await c.update(input([],2000,false));await c.update(input([entry('old',1500)],3000));expect(h.fresh).toEqual([]);
  await c.update(input([entry('new',4000)],4000));expect(h.fresh.flat().map(e=>e.id)).toEqual(['new']);
 });
 it('retries a failed live write without consuming its fresh identity or repeating a successful notice',async()=>{
  const h=harness(),save=h.io.save;let fail=true;
  h.io.save=async rows=>{if(fail){fail=false;throw new Error('Temporary SQLite busy');}return save(rows);};
  const c=h.create();c.gate(true,1000);await c.update(input([],1000));
  await expect(c.update(input([entry('live',2000)],2000))).rejects.toThrow('Temporary SQLite busy');
  expect(h.fresh).toEqual([]);expect(h.read()).toEqual([]);
  await c.update(input([entry('live',2000)],2000));expect(h.fresh.flat().map(e=>e.id)).toEqual(['live']);
  await c.update(input([entry('live',2000)],3000));expect(h.fresh).toHaveLength(1);expect(h.read()).toHaveLength(1);
 });
 it('serializes startup races and cancels UI emissions after reset during an asynchronous write',async()=>{
  const h=harness();let finishLoad!:(entries:ContactEntry[])=>void;
  const loading=new Promise<ContactEntry[]>(r=>{finishLoad=r;});h.io.load=()=>loading;
  const c=h.create();c.gate(true,1000);const first=c.update(input([entry('old',500)],1000)),second=c.update(input([entry('old',500)],2000));
  finishLoad([]);await Promise.all([first,second]);expect(h.fresh).toEqual([]);expect(h.read()).toHaveLength(1);
  let finishSave!:(entries:ContactEntry[])=>void;h.io.save=()=>new Promise(r=>{finishSave=r;});
  const pending=c.update(input([entry('live',3000)],3000));await Promise.resolve();c.dispose();finishSave([entry('live',3000)]);await pending;
  expect(h.fresh).toEqual([]);expect(h.views.at(-1)?.map(e=>e.id)).toEqual(['old']);
 });
 it('updates a receipt outcome without a second celebration or replacing the original observation time',async()=>{
  const h=harness(),c=h.create();c.gate(true,1000);await c.update(input([],1000));await c.update(input([entry('a',2000)],2000));
  const recap:EncounterRecap={activityId:'outing',confirmedVisitPoints:0,confirmedCleanupPoints:0,pendingCleanupPoints:0,encounters:[{outbreakId:'a',name:'a',contactAt:2000,visitPoints:0,cleanupPoints:0,accepted:false,reason:'cooldown',contributionId:null}],updatedAt:3000};
  await c.update(input([],3000,true,recap));expect(h.fresh).toHaveLength(1);expect(h.read()[0]).toMatchObject({timestamp:2000,outcome:{status:'rejected',text:'Not awarded · revisit cooldown'}});
 });
 it('uses shared lab matching, separates paused segments, and rejects foreign-world legacy observations',()=>{
  const ring:[number,number][]=[[23.75,61.49],[23.752,61.49],[23.752,61.492],[23.75,61.492]];
  const world:WorldView={version:1,worldStartedAt:1000,serverTime:5000,outbreaks:[],fieldLabs:[{id:'lab',name:'Field Lab',ring,position:[23.751,61.491],spawnedAt:1000,expiresAt:10000,collected:false}]};
  const fix={timestamp:2000,longitude:23.751,latitude:61.491,accuracy:100,segment:1};
  expect(contactEvidence(world,[],[fix])[0]).toMatchObject({kind:'lab',timestamp:2000});
  const offer:FieldLabOffer={id:'offer',outingId:'outing',rulesVersion:1,worldStartedAt:1000,issuedAt:1500,expiresAt:10000,referenceCentre:null,labs:[{labId:'lab',distanceMetres:1000,fraction:.25}]};
  expect(contactEvidence(world,[],[fix],'outing',offer)[0].offerFraction).toBe(.25);
  expect(contactEvidence(world,[],[fix],'other',offer)[0].offerFraction).toBeUndefined();
  expect(contactEvidence(world,[],[fix],'outing',{...offer,worldStartedAt:0})[0].offerFraction).toBeUndefined();
  expect(contactEvidence(world,[],[fix],'outing',{...offer,expiresAt:5000})[0].offerFraction).toBeUndefined();
  expect(contactEvidence({...world,fieldLabs:[]},[],[fix])).toEqual([]);
  expect(contactEvidence(world,[],[{...fix,longitude:23.748},{...fix,timestamp:2001,longitude:23.754,segment:2}])).toEqual([]);
  expect(contactEvidence(world,[{outbreakId:'old',timestamp:500,visitPoints:70}],[])).toEqual([]);
 });
});
