import {afterEach,describe,it,expect} from 'vitest';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {WorldStore} from './world-store';
import {ActivityStore} from './activity-store';
import {createApp} from './app';
import {activityReceipt,type ActivityChunk} from '@sporeward/protocol';
import {tampereTestOutbreaks,type TestOutbreak} from './test-outbreaks';
import {matchContacts} from '@sporeward/game';
const T=1800000000000;
const fixtures:TestOutbreak[]=[{id:'west',name:'West',accessWay:1,ring:[[23.75,61.5],[23.751,61.5],[23.751,61.501],[23.75,61.501]]},{id:'east',name:'East',accessWay:2,ring:[[23.755,61.5],[23.756,61.5],[23.756,61.501],[23.755,61.501]]}];
const payload=(id='ride',start=T+1000):ActivityChunk=>({activity:{id,started:start,ended:start+200000,sections:[{id:1,started:start,ended:start+200000}]},chunkCount:1,totalFixes:201,fixes:Array.from({length:201},(_,i)=>({timestamp:start+i*1000,longitude:23.747+i*.0001,latitude:61.5005,accuracy:5,segment:1}))});
const dirs:string[]=[];afterEach(async()=>{await Promise.all(dirs.splice(0).map(d=>rm(d,{recursive:true,force:true})));});
async function setup(){const dir=await mkdtemp(join(tmpdir(),'sporeward-world-'));dirs.push(dir);let now=T;const clock=()=>now,world=new WorldStore(join(dir,'world'),clock,()=>fixtures);await world.view('rider');return {dir,world,clock,setNow:(n:number)=>{now=n;}};}
describe('persistent encounter pipeline',()=>{
 it('stores contacts, cleaning and rewards once through concurrent retries and restart',async()=>{
  const s=await setup(),p=payload();s.setNow(p.activity.ended);const receipt=activityReceipt(p.activity,p.fixes,s.clock());
  const results=await Promise.all(Array.from({length:5},()=>s.world.process('rider',p.activity,p.fixes,receipt)));
  expect(results.every(r=>r.confirmedVisitPoints===200)).toBe(true);
  expect((await s.world.view('rider')).outbreaks.every(o=>o.committedCleaning>0&&o.committedCleaning<=1)).toBe(true);
  const restarted=new WorldStore(join(s.dir,'world'),s.clock,()=>{throw new Error('must not reseed');});
  expect(await restarted.process('rider',p.activity,p.fixes,receipt)).toEqual(results[0]);
 });
 it('does not award overlapping sources twice and accepts distinct later outbreak touches',async()=>{
  const s=await setup(),p=payload();s.setNow(p.activity.ended);await s.world.process('rider',p.activity,p.fixes,activityReceipt(p.activity,p.fixes,s.clock()));
  const other=payload('watch',p.activity.started-1000);s.setNow(p.activity.ended+1000);
  const recap=await s.world.process('rider',other.activity,other.fixes,activityReceipt(other.activity,other.fixes,s.clock()));
  expect(recap.confirmedVisitPoints).toBe(0);expect(recap.encounters.map(e=>e.reason)).toEqual(['duplicate','duplicate']);
  const later=payload('later',p.activity.started+6*3600000);s.setNow(later.activity.ended);
  const next=await s.world.process('rider',later.activity,later.fixes,activityReceipt(later.activity,later.fixes,s.clock()));expect(next.confirmedVisitPoints).toBe(100);
 });
 it('withholds effects for an ineligible short activity',async()=>{
  const s=await setup(),p=payload();p.fixes=p.fixes.slice(30,33);p.totalFixes=3;s.setNow(p.activity.ended);
  const recap=await s.world.process('rider',p.activity,p.fixes,activityReceipt(p.activity,p.fixes,s.clock()));
  expect(recap.confirmedVisitPoints).toBe(0);expect(recap.encounters[0].reason).toBe('ineligible');
  expect((await s.world.view('rider')).outbreaks.every(o=>o.committedCleaning===0)).toBe(true);
 });
 it('delayed contacts start treatment on receipt instead of retroactively deleting outbreaks',async()=>{
  const s=await setup(),p=payload();s.setNow(p.activity.ended+20*3600000);
  await s.world.process('rider',p.activity,p.fixes,activityReceipt(p.activity,p.fixes,s.clock()));
  expect((await s.world.view('rider')).outbreaks[0].strength).toBe(4);
  s.setNow(s.clock()+5*60000);const o=(await s.world.view('rider')).outbreaks[0];expect(o.strength).toBeLessThan(4);expect(o.strength).toBeGreaterThan(3.7);
 });
 it('confirms group cleanup bonuses after decay and preserves them after restart',async()=>{
  const s=await setup(),p=payload();s.setNow(p.activity.ended);
  for(const player of ['a','b','c','d'])await s.world.process(player,p.activity,p.fixes,activityReceipt(p.activity,p.fixes,s.clock()));
  expect((await s.world.activity('d','ride'))!.pendingCleanupPoints).toBe(200);
  s.setNow(s.clock()+12*3600000);
  const view=await s.world.view('a');expect(view.outbreaks.every(o=>o.status==='cleared')).toBe(true);
  for(const player of ['a','b','c','d'])expect((await s.world.activity(player,'ride'))!.confirmedCleanupPoints).toBe(200);
  const restart=new WorldStore(join(s.dir,'world'),s.clock);expect((await restart.activity('a','ride'))!.confirmedCleanupPoints).toBe(200);
  const protection=payload('protection',s.clock()+1000);s.setNow(protection.activity.ended);
  const followup=await restart.process('a',protection.activity,protection.fixes,activityReceipt(protection.activity,protection.fixes,s.clock()));
  expect(followup.confirmedCleanupPoints).toBe(0);expect((await restart.activity('a','ride'))!.confirmedCleanupPoints).toBe(200);
 });
 it('reconciles completion when the stored upload receipt predates world processing',async()=>{
  const s=await setup(),p=payload();s.setNow(p.activity.ended);const store=new ActivityStore(join(s.dir,'activities'),'tester',s.clock);
  await store.put(p.activity.id,0,p);await store.finish(p.activity.id);
  const auth={username:'tester',password:'test-only'},app=await createApp({auth,activityStore:store,worldStore:s.world});
  const headers={authorization:'Basic '+Buffer.from('tester:test-only').toString('base64')};
  try{
   expect((await app.inject({url:'/world'})).statusCode).toBe(401);
   const result=await app.inject({method:'POST',url:'/activities/ride/complete',headers,payload:{}});expect(result.json().encounters.confirmedVisitPoints).toBe(200);
   const retry=await app.inject({method:'POST',url:'/activities/ride/complete',headers,payload:{}});expect(retry.json()).toEqual(result.json());
   expect((await app.inject({url:'/activities/ride/encounters',headers})).json().confirmedVisitPoints).toBe(200);
  const footprints=await app.inject({url:'/activities/ride/footprints',headers});expect(footprints.statusCode).toBe(200);expect(footprints.json().activityId).toBe('ride');expect(footprints.json().footprints).toHaveLength(2);
  expect((await app.inject({url:'/activities/other/footprints',headers})).statusCode).toBe(404);
  }finally{await app.close();}
 });
 it('returns only the footprint valid at an owned activity contact time',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'sporeward-footprint-history-'));dirs.push(dir);let now=T;const clock=()=>now;
  const oldRing=fixtures[0]!.ring,newRing=oldRing.map(([longitude,latitude])=>[longitude+.02,latitude] as [number,number]);
  const current=fixtures.map(o=>o.id==='west'?{...o,ring:newRing}:o),world=new WorldStore(join(dir,'world'),clock,()=>current);await world.view('rider');
  const path=join(dir,'world','world.json'),state=JSON.parse(await readFile(path,'utf8'));
  const original=state.footprints.find((f:{id:string})=>f.id==='west');state.footprints=state.footprints.filter((f:{id:string})=>f.id!=='west');
  state.footprints.push({...original,ring:oldRing,validFrom:T,validUntil:T+180000},{...original,ring:newRing,validFrom:T+180000,validUntil:null});await writeFile(path,JSON.stringify(state));
  const p=payload();now=p.activity.ended;const recap=await world.process('rider',p.activity,p.fixes,activityReceipt(p.activity,p.fixes,now));
  const west=recap.encounters.find(e=>e.outbreakId==='west')!;expect(west.contactAt).toBeLessThan(T+180000);
  const result=await world.activityFootprints('rider','ride');expect(result?.footprints.find(f=>f.outbreakId==='west')?.ring).toEqual(oldRing);
  expect(await world.activityFootprints('someone-else','ride')).toBeNull();
 });
});
it('the Tampere fixture footprints include their publicly checked access paths',()=>{
 const access:[[number,number],[number,number],[number,number],[number,number],[number,number]]=[[23.7619996,61.4839089],[23.7273125,61.5003719],[23.7638238,61.5019885],[23.810108,61.5102042],[23.8013183,61.4978981]];
 const zones=tampereTestOutbreaks();expect(zones).toHaveLength(5);
 zones.forEach((zone,i)=>expect(matchContacts([{timestamp:1000,longitude:access[i][0],latitude:access[i][1],segment:1}],[{id:zone.id,ring:zone.ring,validFrom:0,validUntil:null}])).toHaveLength(1));
});

it('awards a historical retired-parent visit without granting a false cleanup bonus or touching replacements',async()=>{
 const s=await setup(),path=join(s.dir,'world','world.json'),state=JSON.parse(await readFile(path,'utf8'));
 const parent=state.fixtures.find((f:{id:string})=>f.id==='west'),target=state.engine.targets.find((o:{id:string})=>o.id==='west');
 parent.retiredAt=T+100000;target.cleared=100000/60000;target.strength=0;
 for(const footprint of state.footprints)if(footprint.id==='west')footprint.validUntil=parent.retiredAt;
 await writeFile(path,JSON.stringify(state));s.setNow(T+20*60000);
 const p=payload('late-parent'),receipt=activityReceipt(p.activity,p.fixes,s.clock());
 const result=await s.world.process('late-rider',p.activity,p.fixes,receipt);
 expect(result.encounters.find(e=>e.outbreakId==='west')).toMatchObject({accepted:true,visitPoints:100,cleanupPoints:0});
 const saved=JSON.parse(await readFile(path,'utf8')),retired=saved.engine.targets.find((o:{id:string})=>o.id==='west');
 expect(retired.treatments).toEqual([]);expect(retired.awarded).toEqual([]);expect(retired.strength).toBe(0);
 const again=await s.world.process('late-rider',p.activity,p.fixes,receipt);expect(again).toEqual(result);
});

it('preserves historical finishing-group awards after protection arrivals and restart',async()=>{
 const s=await setup(),path=join(s.dir,'world','world.json'),state=JSON.parse(await readFile(path,'utf8'));
 for(const o of state.engine.targets){o.strength=1;o.unit=.2;}state.engine.effort=1;
 await writeFile(path,JSON.stringify(state));const p=payload('original');s.setNow(p.activity.ended);
 await s.world.process('original',p.activity,p.fixes,activityReceipt(p.activity,p.fixes,s.clock()));
 s.setNow(s.clock()+12*3600000);await s.world.tick();
 const protection=payload('protection',s.clock()+1000);s.setNow(protection.activity.ended);
 expect((await s.world.process('protection',protection.activity,protection.fixes,activityReceipt(protection.activity,protection.fixes,s.clock()))).confirmedCleanupPoints).toBe(200);
 const late=payload('late-friend',p.activity.started+5*60000);
 const recap=await s.world.process('late-friend',late.activity,late.fixes,activityReceipt(late.activity,late.fixes,s.clock()));
 expect(recap.confirmedCleanupPoints).toBe(200);
 const restart=new WorldStore(join(s.dir,'world'),s.clock);
 expect((await restart.activity('original','original'))!.confirmedCleanupPoints).toBe(200);
 expect((await restart.activity('protection','protection'))!.confirmedCleanupPoints).toBe(200);
 expect(await restart.process('late-friend',late.activity,late.fixes,activityReceipt(late.activity,late.fixes,s.clock()))).toEqual(recap);
});
it('accepts older independent source contacts without resetting the newest cooldown',async()=>{
 const s=await setup(),later=payload('later',T+7*3600000);s.setNow(later.activity.ended);
 await s.world.process('rider',later.activity,later.fixes,activityReceipt(later.activity,later.fixes,s.clock()));
 const earlier=payload('earlier');expect((await s.world.process('rider',earlier.activity,earlier.fixes,activityReceipt(earlier.activity,earlier.fixes,s.clock()))).confirmedVisitPoints).toBe(200);
 const blocked=payload('too-soon',T+8*3600000);s.setNow(blocked.activity.ended);
 expect((await s.world.process('rider',blocked.activity,blocked.fixes,activityReceipt(blocked.activity,blocked.fixes,s.clock()))).encounters.every(e=>e.reason==='cooldown')).toBe(true);
 const next=payload('next',T+13*3600000);s.setNow(next.activity.ended);
 const result=await s.world.process('rider',next.activity,next.fixes,activityReceipt(next.activity,next.fixes,s.clock()));expect(result.encounters.map(e=>({reason:e.reason,points:e.visitPoints,at:e.contactAt}))).toEqual([{reason:'accepted',points:25,at:expect.any(Number)},{reason:'accepted',points:25,at:expect.any(Number)}]);
});
