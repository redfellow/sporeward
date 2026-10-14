import {tampereWorldFixtures} from '../spatial/tampere.ts';
import {readFile,mkdir,rm,lstat,realpath,writeFile} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {parseReplayTrack,rebaseReplay,activityReceipt,type ActivityChunk,type EncounterRecap,type WorldView} from '@sporeward/protocol';
import {WorldStore} from '../world-store.ts';
import {ActivityStore} from '../activity-store.ts';
import {tampereTestOutbreaks} from '../test-outbreaks.ts';
import {ReplayTimeline,SimulationClock} from './timeline.ts';
export type Scenario={version:1;world?:'fixtures'|'tampere';id:string;baseline:string;seed:number;players:{id:string;name:string}[];rides:{id:string;player:string;track:string;offsetMs:number;uploadDelayMs:number;retries:number}[];settleMs:number};
const id=(v:unknown):v is string=>typeof v==='string'&&/^[A-Za-z0-9-]{1,80}$/.test(v)&&!Object.hasOwn(Object.prototype,v);
const duration=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=366*86400000;
export function parseScenario(value:unknown):Scenario {
 const v=value as Scenario;
 if(!v||v.version!==1||!id(v.id)||typeof v.baseline!=='string'||!/(Z|[+-]\d\d:\d\d)$/.test(v.baseline)||!Number.isSafeInteger(Date.parse(v.baseline))||Date.parse(v.baseline)<=0||!Number.isSafeInteger(v.seed)||v.seed<0||v.seed>0xffffffff||!duration(v.settleMs)||!Array.isArray(v.players)||!v.players.length||v.players.length>50||!Array.isArray(v.rides)||v.rides.length>1000)throw new Error('Invalid replay scenario.');
 if(v.world!==undefined&&!['fixtures','tampere'].includes(v.world))throw new Error('Invalid scenario world.');
 const players=new Set<string>(),sources=new Set<string>();
 for(const p of v.players){if(!p||!id(p.id)||players.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>80)throw new Error('Invalid scenario player.');players.add(p.id);}
 for(const r of v.rides){const key=r?.player+'/'+r?.id;if(!r||!id(r.id)||!players.has(r.player)||typeof r.track!=='string'||!r.track||!duration(r.offsetMs)||!duration(r.uploadDelayMs)||!Number.isSafeInteger(r.retries)||r.retries<0||r.retries>10||sources.has(key))throw new Error('Invalid scheduled outing.');sources.add(key);}
 return v;
}
type PreparedRide={ride:Scenario['rides'][number];payload:ActivityChunk};
export type ScenarioSummary={scenario:string;clock:string;status:ReturnType<ReplayTimeline<PreparedRide>['status']>;players:{id:string;name:string;confirmedPoints:number;pendingCleanupPoints:number}[];outings:{player:string;id:string;recap:EncounterRecap}[];world:WorldView};
/** All mutation is confined to a marked, disposable directory under work/replay/runs.
 * There is no external API URL or public-server reset operation in this runner.
 */
export class ScenarioRunner {
 readonly clock:SimulationClock;
 readonly timeline:ReplayTimeline<PreparedRide>;
 private world!:WorldStore;
 private processed=new Set<string>();
 private queue=Promise.resolve();
 private constructor(readonly definition:Scenario,private directory:string,events:{at:number;order:number;value:PreparedRide}[]){this.clock=new SimulationClock(Date.parse(definition.baseline));this.timeline=new ReplayTimeline(this.clock,events);}
 static async load(path:string,runsRoot:string):Promise<ScenarioRunner> {
  const definition=parseScenario(JSON.parse(await readFile(path,'utf8'))),events=[];
  for(const [order,ride] of definition.rides.entries()) {
   const track=parseReplayTrack(JSON.parse(await readFile(resolve(dirname(path),ride.track),'utf8')));
   const payload=rebaseReplay(track,Date.parse(definition.baseline)+ride.offsetMs,ride.id);
   events.push({at:payload.activity.ended+ride.uploadDelayMs,order,value:{ride,payload}});
  }
  await mkdir(runsRoot,{recursive:true,mode:0o700});
  if((await lstat(runsRoot)).isSymbolicLink())throw new Error('Simulation root must not be a symlink.');
  const root=await realpath(runsRoot),directory=join(root,'sim-'+definition.id);
  const runner=new ScenarioRunner(definition,directory,events);
  await mkdir(directory,{recursive:true,mode:0o700});
  if((await lstat(directory)).isSymbolicLink())throw new Error('Simulation directory must not be a symlink.');
  try{const marker=JSON.parse(await readFile(join(directory,'simulation.json'),'utf8'));if(marker.kind!=='sporeward-disposable-replay'||marker.scenario!==definition.id)throw new Error('Unrecognized simulation directory.');}
  catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;const {readdir}=await import('node:fs/promises');if((await readdir(directory)).length)throw new Error('Refusing to claim an existing unmarked directory.');await writeFile(join(directory,'simulation.json'),JSON.stringify({kind:'sporeward-disposable-replay',scenario:definition.id}),{mode:0o600});}
  await runner.reset();return runner;
 }
 private serialize<T>(operation:()=>Promise<T>):Promise<T>{const result=this.queue.then(operation);this.queue=result.then(()=>{},()=>{});return result;}
 reset(){return this.serialize(async()=>{
  if((await lstat(this.directory)).isSymbolicLink())throw new Error('Simulation directory changed.');
  const marker=JSON.parse(await readFile(join(this.directory,'simulation.json'),'utf8'));if(marker.kind!=='sporeward-disposable-replay'||marker.scenario!==this.definition.id)throw new Error('Simulation reset marker changed.');
  for(const name of ['world','activities']){const path=join(this.directory,name);try{if((await lstat(path)).isSymbolicLink())throw new Error('Simulation data must not be a symlink.');}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}await rm(path,{recursive:true,force:true});}
  this.timeline.reset();this.processed.clear();
  const generated=this.definition.world==='tampere'?await tampereWorldFixtures(this.definition.seed,20):null;
  this.world=new WorldStore(join(this.directory,'world'),this.clock.now,generated?()=>generated.fixtures:tampereTestOutbreaks,{spatial:generated?.access.cells,seed:this.definition.seed,contributionId:c=>createHash('sha256').update(JSON.stringify([this.definition.seed,c.player,c.activityId,c.outbreakId,c.contactAt])).digest('hex')});
  await this.world.view(this.definition.players[0].id);return this.snapshot();
 });}
 start(){return this.serialize(async()=>{await this.deliver(this.timeline.start());return this.snapshot();});}
 pause(){return this.serialize(async()=>{this.timeline.pause();return this.snapshot();});}
 resume(){return this.serialize(async()=>{await this.deliver(this.timeline.resume());return this.snapshot();});}
 advance(ms:number){return this.serialize(async()=>{
  if(!Number.isSafeInteger(ms)||ms<0)throw new Error('Invalid replay advancement.');
  if(['ready','paused'].includes(this.timeline.status().state))return this.snapshot();
  const target=this.clock.now()+ms;
  if(!Number.isSafeInteger(target))throw new Error('Replay time exceeds the supported range.');
  // Process each delivery at its scheduled time, rather than applying all effects at the final clock.
  while(this.timeline.status().nextAt!==null&&this.timeline.status().nextAt!<=target)await this.deliver(this.timeline.next());
  this.timeline.advance(target-this.clock.now());return this.snapshot();
 });}
 next(){return this.serialize(async()=>{await this.deliver(this.timeline.next());return this.snapshot();});}
 run(){return this.serialize(async()=>{await this.deliver(this.timeline.start());while(this.timeline.status().nextAt!==null)await this.deliver(this.timeline.next());this.clock.advance(this.definition.settleMs);return this.snapshot();});}
 private async deliver(events:ReturnType<ReplayTimeline<PreparedRide>['next']>){
  for(const {value:{ride,payload}} of events){
   const store=new ActivityStore(join(this.directory,'activities'),ride.player,this.clock.now);
   for(let retry=0;retry<=ride.retries;retry++){
    for(let i=0;i<payload.chunkCount;i++)await store.put(payload.activity.id,i,{...payload,fixes:payload.fixes.slice(i*1000,(i+1)*1000)});
    const receipt=await store.finish(payload.activity.id);await this.world.process(ride.player,payload.activity,payload.fixes,receipt);
   }
   this.processed.add(ride.player+'/'+ride.id);
  }
 }
 summary():Promise<ScenarioSummary>{return this.serialize(()=>this.snapshot());}
 private async snapshot():Promise<ScenarioSummary>{
  const outings:ScenarioSummary['outings']=[];
  for(const ride of this.definition.rides)if(this.processed.has(ride.player+'/'+ride.id)){const recap=await this.world.activity(ride.player,ride.id);if(recap)outings.push({player:ride.player,id:ride.id,recap});}
  return {scenario:this.definition.id,clock:new Date(this.clock.now()).toISOString(),status:this.timeline.status(),players:this.definition.players.map(p=>({...p,confirmedPoints:outings.filter(o=>o.player===p.id).reduce((n,o)=>n+o.recap.confirmedVisitPoints+o.recap.confirmedCleanupPoints,0),pendingCleanupPoints:outings.filter(o=>o.player===p.id).reduce((n,o)=>n+o.recap.pendingCleanupPoints,0)})),outings,world:await this.world.view(this.definition.players[0].id)};
 }
}
