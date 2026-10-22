import {it,expect,vi} from 'vitest';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {activityReceipt,type ActivityChunk} from '@sporeward/protocol';
import {matchContacts,pendingCleaning} from '@sporeward/game';
import {WorldStore,type Persisted} from '../world-store';
import {cellRing,tileCoordinate,tilePosition} from './access';
it('matches delayed GPS to a branch that actually withered, without rewinding the present contour',async()=>{
 const root=await mkdtemp(join(tmpdir(),'sporeward-geographic-history-')),baseline=1800000000000;let now=baseline;
 const [tx,ty]=tilePosition([23.76,61.49]),x=Math.floor(tx),y=Math.floor(ty);
 const cells=Array.from({length:5},(_,i)=>({x:x+i,y})),access=[];
 for(let dx=-3;dx<9;dx++)for(let dy=-3;dy<4;dy++)access.push({x:x+dx,y:y+dy,ways:[1]});
 const fixture={id:'branch',name:'Branch',accessWay:1,cells,ring:cellRing(cells)},point=tileCoordinate([x+4.5,y+.5]);
 const payload=(id:string,start:number):ActivityChunk=>({activity:{id,started:start,ended:start+120000,sections:[{id:1,started:start,ended:start+120000}]},totalFixes:121,chunkCount:1,fixes:Array.from({length:121},(_,i)=>({timestamp:start+i*1000,longitude:point[0]+i*.0001,latitude:point[1],accuracy:5,segment:1}))});
 const snapshot=async()=>JSON.parse(await readFile(join(root,'world.json'),'utf8')) as Persisted;
 try{
  let world=new WorldStore(root,()=>now,()=>[fixture],{spatial:access});await world.view('cleaner');
  const first=payload('first',baseline+60000);now=first.activity.ended;
  expect(activityReceipt(first.activity,first.fixes,now).eligibleForGame).toBe(true);
  expect((await world.process('cleaner',first.activity,first.fixes,activityReceipt(first.activity,first.fixes,now))).confirmedVisitPoints).toBe(100);
  const initial=(await world.view('cleaner')).outbreaks[0];now+=13*3600000;
  const current=(await world.view('late')).outbreaks[0];expect(current.ring).not.toEqual(initial.ring);
  const before=await snapshot();expect(before.footprints!.length).toBeGreaterThan(2);
  const delayed=payload('late',baseline+6*60000),present=payload('now',now-120000);
  expect(matchContacts(delayed.fixes,before.footprints!).map(c=>c.outbreakId)).toEqual(['branch']);
  expect(matchContacts(present.fixes,[{id:current.id,ring:current.ring,validFrom:baseline,validUntil:null}])).toEqual([]);
  world=new WorldStore(root,()=>now,()=>{throw new Error('Must retain the persisted geographic world');},{spatial:access});
  const result=await world.process('late',delayed.activity,delayed.fixes,activityReceipt(delayed.activity,delayed.fixes,now));
  expect(result.confirmedVisitPoints).toBe(100);
  const after=await snapshot();expect(after.fixtures[0].ring).toEqual(before.fixtures[0].ring);
  expect(after.engine.targets[0].strength).toBe(before.engine.targets[0].strength);
  expect(pendingCleaning(after.engine.targets[0])).toBe(1);
  expect(await world.process('late',delayed.activity,delayed.fixes,activityReceipt(delayed.activity,delayed.fixes,now))).toEqual(result);
  now+=5*60000;expect((await world.view('late')).outbreaks[0].strength).toBeLessThan(current.strength);
 }finally{await rm(root,{recursive:true,force:true});}
});
it('upgrades a legacy outline once and keeps its earlier contact interval intact',async()=>{
 const root=await mkdtemp(join(tmpdir(),'sporeward-outline-upgrade-'));let now=1800000000000;
 const [tx,ty]=tilePosition([23.76,61.49]),cells=Array.from({length:5},(_,i)=>({x:Math.floor(tx)+i,y:Math.floor(ty)})),oldRing=cellRing(cells),access=cells.map(c=>({...c,ways:[1]}));
 const world=new WorldStore(root,()=>now,()=>[{id:'legacy-shape',name:'Legacy',accessWay:1,cells,ring:oldRing}],{spatial:access});
 try{
  await world.view('rider');const before=JSON.parse(await readFile(join(root,'world.json'),'utf8')) as Persisted;now+=30000;
  expect(await world.prepareOrganicContours()).toEqual({alreadyPrepared:false,changed:1});
  const after=JSON.parse(await readFile(join(root,'world.json'),'utf8')) as Persisted;
  expect(after.contourVersion).toBe(4);expect(after.fixtures[0].surface?.length).toBeGreaterThan(3);
  expect(after.footprints![0].ring).toEqual(oldRing);expect(after.footprints![0].validUntil).toBe(now);
  expect(after.footprints!.at(-1)!.validFrom).toBe(now);expect(after.fixtures[0].ring).not.toEqual(oldRing);expect(after.fixtures[0].ring.length).toBeLessThanOrEqual(500);
  expect(after.engine.scores).toEqual(before.engine.scores);expect(after.contributions).toEqual(before.contributions);
  expect(await world.prepareOrganicContours()).toEqual({alreadyPrepared:true});
  expect((JSON.parse(await readFile(join(root,'world.json'),'utf8')) as Persisted).footprints).toHaveLength(after.footprints!.length);
 }finally{await rm(root,{recursive:true,force:true});}
});

it('matches eligible recent GPS from the archive when snapshots contain only live outlines',async()=>{
 const baseline=1800000000000;let now=baseline,state:Persisted|undefined;
 const oldRing:[[number,number],[number,number],[number,number],[number,number]]=[[23.7,61.5],[23.701,61.5],[23.701,61.501],[23.7,61.501]];
 const archived={id:'history',ring:oldRing,validFrom:baseline,validUntil:baseline+600000};
 const historicalFootprints=vi.fn(async()=>[archived]);
 const persistence:import('../database/world').WorldPersistence={transaction:async(initial,operation)=>operation(state??=initial()),historicalFootprints};
 const world=new WorldStore('/unused',()=>now,()=>[{id:'history',name:'History',accessWay:1,ring:oldRing.map(([x,y])=>[x+.02,y])}],{persistence});
 // The live snapshot starts after a historical shape transition.
 await world.view('late');state!.engine.time=10;state!.footprints![0].validFrom=baseline+600000;now=baseline+1800000;
 const start=baseline+60000,activity={id:'archived-outing',started:start,ended:start+120000,sections:[{id:1,started:start,ended:start+120000}]};
 const fixes=Array.from({length:121},(_,i)=>({timestamp:start+i*1000,longitude:23.7005+i*.0001,latitude:61.5005,accuracy:5,segment:1}));
 const result=await world.process('late',activity,fixes,activityReceipt(activity,fixes,now));
 expect(historicalFootprints).toHaveBeenCalledWith(start,start+120000);expect(result.confirmedVisitPoints).toBe(100);
});

it('prefers the transaction shape intervals over a stale open archive during catch-up',async()=>{
 const baseline=1800000000000;let now=baseline,state:Persisted|undefined;
 const ring:[number,number][]=[[23.7,61.5],[23.701,61.5],[23.701,61.501],[23.7,61.501]];
 const archive={id:'history',ring,validFrom:baseline,validUntil:null};
 const persistence:import('../database/world').WorldPersistence={transaction:async(initial,operation)=>operation(state??=initial()),historicalFootprints:async()=>[archive]};
 const world=new WorldStore('/unused',()=>now,()=>[{id:'history',name:'History',accessWay:1,ring}],{persistence});
 await world.view('late');now=baseline+600000;await world.view('late');
 state!.fixtures[0].ring=ring.map(([x,y])=>[x+.02,y]);await world.view('late');now=baseline+1800000;
 const start=baseline+1200000,activity={id:'after-move',started:start,ended:start+120000,sections:[{id:1,started:start,ended:start+120000}]};
 const fixes=Array.from({length:121},(_,i)=>({timestamp:start+i*1000,longitude:23.7005+i*.0001,latitude:61.5005,accuracy:5,segment:1}));
 const result=await world.process('late',activity,fixes,activityReceipt(activity,fixes,now));
 expect(result.confirmedVisitPoints).toBe(0);
});

it('checkpoints long offline catch-up in at most one-hour transactions',async()=>{
 const baseline=1800000000000;let now=baseline,state:Persisted|undefined;const commits:number[]=[];
 const persistence:import('../database/world').WorldPersistence={transaction:async(initial,operation)=>{const result=await operation(state??=initial());commits.push(state!.engine.time);return result;}};
 const world=new WorldStore('/unused',()=>now,()=>[{id:'zone',name:'Zone',accessWay:1,ring:[[23,61],[23.001,61],[23.001,61.001]]}],{persistence});
 await world.view('rider');commits.length=0;now+=181*60000;await world.view('rider');
 expect(commits).toEqual([60,120,180,181]);
});

it('does not regenerate geometry every minute between quantized growth steps',async()=>{
 const root=await mkdtemp(join(tmpdir(),'sporeward-growth-quantization-'));let now=1800000000000;
 const [tx,ty]=tilePosition([23.76,61.49]),cells=Array.from({length:5},(_,i)=>({x:Math.floor(tx)+i,y:Math.floor(ty)}));
 const access=[];for(let x=cells[0].x-2;x<cells[0].x+10;x++)for(let y=cells[0].y-2;y<cells[0].y+3;y++)access.push({x,y,ways:[1]});
 const world=new WorldStore(root,()=>now,()=>[{id:'growth',name:'Growth',accessWay:1,cells,ring:cellRing(cells)}],{spatial:access});
 try{await world.view('rider');now+=45*60000;await world.view('rider');const state=JSON.parse(await readFile(join(root,'world.json'),'utf8')) as Persisted;
  expect(state.footprints!.length).toBeLessThanOrEqual(3);expect(state.footprints!.length).toBeGreaterThan(1);
 }finally{await rm(root,{recursive:true,force:true});}
});

it('starts shoreline constraints now while preserving earlier boundaries and rewards',async()=>{
 const root=await mkdtemp(join(tmpdir(),'sporeward-shoreline-history-'));let now=1800000000000;
 const [tx,ty]=tilePosition([23.76,61.49]),cells=Array.from({length:5},(_,i)=>({x:Math.floor(tx)+i,y:Math.floor(ty)}));
 const ring:[number,number][]=[[23.76,61.49],[23.764,61.49],[23.764,61.494],[23.76,61.494]];
 const world=new WorldStore(root,()=>now,()=>[{id:'shore',name:'Shore',accessWay:1,cells,ring}],{spatial:cells.map(c=>({...c,ways:[1]}))});
 const water:import('./water').WaterPolygon[]=[[[[23.759,61.489],[23.762,61.489],[23.762,61.495],[23.759,61.495]]]];
 try{
  await world.view('rider');const before=JSON.parse(await readFile(join(root,'world.json'),'utf8')) as Persisted;now+=30000;
  expect(await world.prepareShorelines(water)).toEqual({alreadyPrepared:false,changed:1,relocated:0});
  const after=JSON.parse(await readFile(join(root,'world.json'),'utf8')) as Persisted;
  expect(after.contourVersion).toBe(5);expect(after.footprints![0].ring).toEqual(ring);expect(after.footprints![0].validUntil).toBe(now);
  expect(Math.min(...after.fixtures[0].ring.map(p=>p[0]))).toBe(23.762);expect(after.footprints!.at(-1)!.validFrom).toBe(now);
  expect(after.engine.scores).toEqual(before.engine.scores);expect(after.contributions).toEqual(before.contributions);
  expect(await world.prepareOrganicContours()).toEqual({alreadyPrepared:true});expect(await world.prepareShorelines(water)).toEqual({alreadyPrepared:true});
 }finally{await rm(root,{recursive:true,force:true});}
});
