import { afterEach, expect, it } from 'vitest';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { commitResistance, createResistance, createWorld, resistanceAt } from '@sporeward/game';
import { activityReceipt, parseEncounterRecap, parseFieldLabOffer, parseWorldView, FIELD_LAB_REWARD_NAMES, type ActivityChunk } from '@sporeward/protocol';
import { WorldStore, type Persisted } from './world-store';
import { loadTampereAccess } from './spatial/tampere';
import { resistanceOwnerKey, ownerResistance } from './resistance-state';
import { rewardName, settleLabContact } from './lab-settlement';
import { createApp } from './app';

const T=1800000000000;
const roots:string[]=[];
afterEach(async()=>{await Promise.all(roots.splice(0).map(root=>rm(root,{recursive:true,force:true})));});
async function setup() {
 const root=await mkdtemp(join(tmpdir(),'sporeward-lab-settlement-'));roots.push(root);
 const {cells}=await loadTampereAccess();let now=T;
 const world=new WorldStore(root,()=>now,()=>[],{spatial:cells,seed:73});
 await world.configureResistance(true);await world.prepareFieldLabs();
 const read=async():Promise<Persisted>=>JSON.parse(await readFile(join(root,'world.json'),'utf8'));
 const state=await read(),lab=state.fieldLabs!.labs[0];
 for(const player of ['a','b']){
  let personal=createResistance();
  for(let i=0;i<20;i++)personal=commitResistance(personal,{id:`${player}-${i}`,at:T,strength:1,point:{longitude:lab.position[0]-.3,latitude:lab.position[1]}},true).state;
  state.resistance!.players[resistanceOwnerKey(player)]=personal;
 }
 await writeFile(join(root,'world.json'),JSON.stringify(state));
 const ride=(id:string,started=T+1000,which=lab):ActivityChunk=>({
  activity:{id,started,ended:started+200000,sections:[{id:1,started,ended:started+200000}]},chunkCount:1,totalFixes:201,
  fixes:Array.from({length:201},(_,i)=>({timestamp:started+i*1000,longitude:which.position[0]-.01+i*.0001,latitude:which.position[1],accuracy:5,segment:1})),
 });
 const process=(store:WorldStore,player:string,batch:ActivityChunk)=>store.process(player,batch.activity,batch.fixes,activityReceipt(batch.activity,batch.fixes,now));
 return {world,root,cells,read,lab,ride,process,setNow:(n:number)=>{now=n;},clock:()=>now};
}

it('freezes server-issued offers, independently collects co-op visits once and retains collected state after restart',async()=>{
 const s=await setup();
 const offer=parseFieldLabOffer(await s.world.labOffer('a','outing'));
 expect(await s.world.labOffer('a','outing')).toEqual(offer);
 expect(offer.labs.find(entry=>entry.labId===s.lab.id)!.fraction).toBe(.8);
 const ride=s.ride('outing');s.setNow(ride.activity.ended);
 const results=await Promise.all(Array.from({length:4},()=>s.process(s.world,'a',ride)));
 expect(results.every(result=>JSON.stringify(result)===JSON.stringify(results[0]))).toBe(true);
 const collected=results[0].labCollections!.find(result=>result.labId===s.lab.id)!;
 expect(collected).toMatchObject({status:'confirmed',offerSource:'quoted',offeredFraction:.8,actualFraction:.8});
 expect(collected.resistanceReduction).toBeGreaterThan(0);
 const a=parseWorldView(await s.world.view('a')),b=parseWorldView(await s.world.view('b'));
 expect(a.fieldLabs!.find(lab=>lab.id===s.lab.id)!.collected).toBe(true);
 expect(b.fieldLabs!.find(lab=>lab.id===s.lab.id)!.collected).toBe(false);
 const friend=await s.process(s.world,'b',ride);
 expect(friend.labCollections!.find(result=>result.labId===s.lab.id)!).toMatchObject({status:'confirmed',offerSource:'reconciled',actualFraction:.8});
 const restarted=new WorldStore(s.root,s.clock,()=>[],{spatial:s.cells,seed:73});
 expect(await s.process(restarted,'a',ride)).toEqual(results[0]);
 expect((await restarted.view('a')).fieldLabs!.find(lab=>lab.id===s.lab.id)!.collected).toBe(true);
 const repeated=await s.process(restarted,'a',s.ride('second-outing'));
 expect(repeated.labCollections!.find(result=>result.labId===s.lab.id)!).toMatchObject({status:'already-collected',resistanceReduction:0,actualFraction:0,rewardName:collected.rewardName});
});

it('caps concurrently opened outings against shared settlement load and available resistance',async()=>{
 const s=await setup();await s.world.labOffer('a','one');await s.world.labOffer('a','two');
 const labs=(await s.read()).fieldLabs!.labs;
 const first=s.ride('one',T+1000,labs[0]),second=s.ride('two',T+300000,labs[1]);
 s.setNow(second.activity.ended);
 const before=resistanceAt(ownerResistance((await s.read()).resistance!,'a'),s.clock());
 const [a,b]=await Promise.all([s.process(s.world,'a',first),s.process(s.world,'a',second)]);
 const one=a.labCollections!.find(result=>result.labId===labs[0].id)!;
 const two=b.labCollections!.find(result=>result.labId===labs[1].id)!;
 expect(two.actualFraction).toBeLessThan(one.actualFraction);
 expect(two.actualFraction).toBeLessThanOrEqual(.8/3);
 const after=resistanceAt(ownerResistance((await s.read()).resistance!,'a'),s.clock());
 expect(one.resistanceReduction+two.resistanceReduction).toBeCloseTo(before-after);
 expect(after).toBeGreaterThan(0);
});

it('rejects expired-at-contact and ineligible tracks, accepts delayed valid contacts and reports authoritative offline reconciliation',async()=>{
 const s=await setup();
 const state=await s.read();
 state.fieldLabs!.labs[0].expiresAt=T+500;
 state.fieldLabs!.labs[1].expiresAt=T+300000;
 await writeFile(join(s.root,'world.json'),JSON.stringify(state));
 const ride=s.ride('expired');s.setNow(ride.activity.ended);
 expect((await s.process(s.world,'a',ride)).labCollections!.find(result=>result.labId===s.lab.id)!.status).toBe('expired');
 const second=state.fieldLabs!.labs[1],valid=s.ride('offline',T+1000,second);
 s.setNow(valid.activity.ended+12*3600000);
 const recap=parseEncounterRecap(await s.process(s.world,'a',valid),'offline');
 expect(recap.labCollections!.find(result=>result.labId===second.id)!).toMatchObject({status:'confirmed',offerSource:'reconciled'});
 const late=s.ride('outside-window',T+1000,second);s.setNow(late.activity.ended+25*3600000);
 expect((await s.process(s.world,'b',late)).labCollections!.find(result=>result.labId===second.id)!.status).toBe('ineligible');
});

it('validates offer endpoints, ignores no client references and preserves all ten flavour names without mechanical differences',async()=>{
 const s=await setup(),app=await createApp({worldStore:s.world});
 try{
  expect((await app.inject({method:'POST',url:'/outings/outing/lab-offer',payload:{centre:[0,0],fraction:1}})).statusCode).toBe(400);
  const response=await app.inject({method:'POST',url:'/outings/outing/lab-offer',payload:{}});
  expect(response.statusCode).toBe(200);
  const offer=parseFieldLabOffer(response.json());
  expect(() => parseFieldLabOffer({...offer,labs:[{labId:'lab',distanceMetres:-1,fraction:2}]})).toThrow();
  const names=new Set<string>();
  for(let i=0;names.size<10&&i<1000;i++)names.add(rewardName(`name-${i}`));
  expect([...names].sort()).toEqual([...FIELD_LAB_REWARD_NAMES].sort());
  const base=await s.read();
  const exercised=new Set<string>();
  for(let i=0;i<1000&&exercised.size<10;i++){
   const state=structuredClone(base),player=`flavour-${i}`;
   state.resistance!.players[resistanceOwnerKey(player)]=ownerResistance(base.resistance!,'a');
   const result=settleLabContact(state,player,'flavour',state.fieldLabs!.labs[0],T+100,true,T+100);
   expect(result.actualFraction).toBe(.8);
   expect(result.resistanceReduction).toBeCloseTo(3.68,3);
   exercised.add(result.rewardName!);
  }
  expect(exercised.size).toBe(10);
 }finally{await app.close();}
});

it('orders ordinary contacts and labs by recorded time so restoration benefits the later ordinary contact',async()=>{
 const s=await setup(),state=await s.read();
 state.fixtures=[-.005,.005].map((offset,i)=>{
  const x=s.lab.position[0]+offset,y=s.lab.position[1];
  return {id:`target-${i}`,name:`Target ${i}`,accessWay:1,ring:[[x-.0003,y-.0003],[x+.0003,y-.0003],[x+.0003,y+.0003],[x-.0003,y+.0003]] as [number,number][]};
 });
 state.engine=createWorld({ids:state.fixtures.map(f=>f.id),effort:100,balance:{splitProbability:0}});
 state.footprints=[];
 await writeFile(join(s.root,'world.json'),JSON.stringify(state));
 await s.world.labOffer('a','ordered');
 const ride=s.ride('ordered');s.setNow(ride.activity.ended);
 const result=await s.process(s.world,'a',ride);
 expect(result.encounters).toHaveLength(2);
 expect(result.encounters[0].contactAt).toBeLessThan(result.labCollections![0].contactAt);
 expect(result.encounters[1].contactAt).toBeGreaterThan(result.labCollections![0].contactAt);
 expect(result.encounters[0].visitPoints).toBe(100);
 expect(result.encounters[1].visitPoints).toBeGreaterThan(95);
 const saved=await s.read();
 expect(ownerResistance(saved.resistance!,'a').contributions).toHaveLength(22);
 expect(saved.engine.targets.every(target=>target.treatments.length===1)).toBe(true);
});
