import {it,expect} from 'vitest';
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
