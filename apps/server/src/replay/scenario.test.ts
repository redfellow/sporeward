import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {it,expect} from 'vitest';
import {ScenarioRunner,parseScenario,type Scenario} from './scenario';
const baseline='2026-10-14T08:00:00Z';
it('repeats scheduled contributions and decay exactly after reset, with no early uploads',async()=>{
 const root=await mkdtemp(join(tmpdir(),'sporeward-scenario-'));
 try{
  const fixes=Array.from({length:201},(_,i)=>({timestamp:1000+i*1000,latitude:61.4839089,longitude:23.757+i*.0001,accuracy:5,segment:1}));
  await writeFile(join(root,'track.json'),JSON.stringify({version:1,source:{name:'synthetic',format:'json',sha256:'a'.repeat(64)},started:1000,ended:201000,sections:[{id:1,started:1000,ended:201000}],fixes,events:[],summary:{fixes:201}}));
  const definition:Scenario={version:1,id:'repeatable',baseline,seed:73,players:[{id:'a',name:'A'},{id:'b',name:'B'}],rides:[{id:'one',player:'a',track:'track.json',offsetMs:0,uploadDelayMs:0,retries:3},{id:'two',player:'b',track:'track.json',offsetMs:60000,uploadDelayMs:3600000,retries:2}],settleMs:12*3600000};
  await writeFile(join(root,'scenario.json'),JSON.stringify(definition));
  const runner=await ScenarioRunner.load(join(root,'scenario.json'),join(root,'runs'));
  expect((await runner.start()).outings).toHaveLength(0);expect((await runner.advance(100000)).outings).toHaveLength(0);
  await runner.pause();expect((await runner.advance(3600000)).status.now).toBe(Date.parse(baseline)+100000);
  await runner.resume();expect((await runner.next()).outings).toHaveLength(1);
  const first=await runner.run();expect(first.players.map(p=>p.confirmedPoints)).toEqual([100,100]);
  await runner.reset();const second=await runner.run();expect(second).toEqual(first);
 }finally{await rm(root,{recursive:true,force:true});}
});
it('refuses ambiguous identities and backwards scheduling',()=>{
 expect(()=>parseScenario({version:1,id:'../world'})).toThrow();
});
