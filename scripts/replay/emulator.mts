import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {parseReplayTrack} from '../../packages/protocol/src/replay.ts';
import {nativeReplayPlan} from '../../apps/server/src/replay/native-plan.ts';
import {emulatorControl,quote,wait} from './emulator-control.mts';
const file=process.argv[2];if(!file)throw new Error('Usage: npm run replay:emulator -- track.json [--from=SECONDS] [--duration=SECONDS] [--interrupt-after=SECONDS] [--upload]');
const serial=process.argv.find(a=>a.startsWith('--device='))?.slice(9)??'emulator-5554';
if(!/^emulator-\d+$/.test(serial))throw new Error('Native replay targets Android emulators only.');
const seconds=(name:string,fallback:number)=>{const option=process.argv.find(a=>a.startsWith('--'+name+'='));const value=option?Number(option.split('=')[1]):fallback;if(!Number.isFinite(value)||value<0||!Number.isSafeInteger(value*1000))throw new Error('Invalid '+name);return value*1000;};
const track=parseReplayTrack(JSON.parse(await readFile(file,'utf8'))),plan=nativeReplayPlan(track,seconds('from',0),seconds('duration',(track.ended-track.started)/1000));
const interruptOption=process.argv.some(a=>a.startsWith('--interrupt-after='));const interruptAfter=interruptOption?seconds('interrupt-after',0):null;
if(interruptAfter!==null&&(interruptAfter<1000||interruptAfter>=plan.durationMs))throw new Error('interrupt-after must be at least 1 second and before the replay duration ends.');
let activity:string|null=null,started=false,interrupted=false,recoveryResult:{fixesBefore:number;fixesAfter:number;segments:number}|null=null;
process.once('SIGINT',()=>{interrupted=true;});process.once('SIGTERM',()=>{interrupted=true;});
const metroPort=Number(process.argv.find(a=>a.startsWith('--metro-port='))?.slice(13)??8081);
if(!Number.isInteger(metroPort)||metroPort<1||metroPort>65535)throw new Error('Invalid Metro port.');
const control=emulatorControl({serial,metroPort}),{adbPath,adb,shell,launchDevClient,status,fix,waitForJavascript}=control;
const command=(action:string)=>control.command(action,activity),session=control.session;
if((await shell(['getprop','ro.kernel.qemu'])).trim()!=='1')throw new Error('Device does not identify as an emulator.');
async function interruptAndRecover(baseline:number){
 if(interruptAfter===null||recoveryResult||!activity)return baseline;
 const before=await status();
 if(before.activity?.id!==activity||before.activity.status!=='recording'||before.fixCount<1)throw new Error('Cannot interrupt replay before at least one saved fix exists.');
 const interruptedAt=performance.now();
 await shell(['am','force-stop','com.sporeward.app']);
 await adb(['logcat','-c']);
 await wait(1000);
 await launchDevClient();
 await waitForJavascript();
 const after=await command('recover');
 if(after.activity?.id!==activity||after.activity.status!=='recording'||after.segments<before.segments+1||after.fixCount<before.fixCount)throw new Error('Android recorder did not recover the same outing with saved fixes and a new route section.');
 recoveryResult={fixesBefore:before.fixCount,fixesAfter:after.fixCount,segments:after.segments};
 console.log('Android app force-stopped and recovered the active outing: '+JSON.stringify(recoveryResult));
 return baseline+(performance.now()-interruptedAt);
}
async function waitUntil(target:number,baseline:number){
 let currentBaseline=baseline;
 while(performance.now()-currentBaseline<target&&!interrupted){
  const elapsed=performance.now()-currentBaseline;
  if(interruptAfter!==null&&!recoveryResult&&elapsed>=interruptAfter){currentBaseline=await interruptAndRecover(currentBaseline);continue;}
  const next=interruptAfter!==null&&!recoveryResult?Math.min(target,interruptAfter):target;
  await wait(Math.min(100,next-elapsed));
 }
 return currentBaseline;
}
try{
 await adb(['logcat','-c']);
 await launchDevClient();
 await waitForJavascript();
 await command('status');
 const initial=await status();if(initial.activity&&initial.activity.status!=='finished')throw new Error('Finish the existing emulator activity first.');
 const accountPath=process.argv.find(a=>a.startsWith('--account='))?.slice(10);
 if(accountPath){
  const account=JSON.parse(await readFile(accountPath,'utf8'));if(typeof account.username!=='string'||typeof account.password!=='string'||account.username.length>40||account.password.length>256)throw new Error('Invalid private replay account file.');
  await new Promise<void>((resolve,reject)=>{
   const args=['run-as','com.sporeward.app','sh','-c','umask 077; cat > files/sporeward-replay-account.json'];
   const child=spawn(adbPath,['-s',serial,'shell',args.map(quote).join(' ')],{stdio:['pipe','ignore','ignore']});
   child.on('error',()=>reject(new Error('Could not stage private emulator account.')));child.on('close',code=>code===0?resolve():reject(new Error('Could not stage private emulator account.')));child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify({username:account.username,password:account.password}));
  });
  await command('sign-in');
 }
 if(!process.argv.includes('--keep-world'))await command('reset-world');
 // Environment is checked through the authenticated app bridge below; normal
 // recording cannot continue a world whose lifecycle clock was fast-forwarded.
 await command('check-clock');
 let positioned=false;
 for(let attempt=0;attempt<5;attempt++){
  await fix(plan.first.longitude,plan.first.latitude);
  const ready=await command('prepare'),p=ready.control.position;
  const metres=p?Math.hypot((p.longitude-plan.first.longitude)*Math.cos(plan.first.latitude*Math.PI/180),p.latitude-plan.first.latitude)*111320:Infinity;
  if(metres<=30){positioned=true;break;}
  await wait(500);
 }
 if(!positioned)throw new Error('Emulator GPS has not settled at the source start. No recording was created.');
 const recording=await command('start');activity=recording.activity.id;started=true;
 if(plan.initiallyPaused)await command('pause');
 let baseline=performance.now();let lastProgress=0,maxLateness=0;
 console.log('Native replay started at 1× on '+serial+'; using today’s Android recorder clock.');
 for(const [index,event] of plan.events.entries()){
  baseline=await waitUntil(event.at,baseline);
  if(interrupted)break;
  const lateness=performance.now()-baseline-event.at;maxLateness=Math.max(maxLateness,lateness);
  if(lateness>2000){interrupted=true;console.error('Replay stopped: scheduler fell more than 2 seconds behind. Recording preserved; automatic upload skipped.');break;}

  if(event.action==='fix')await fix(event.fix!.longitude,event.fix!.latitude);else await command(event.action);
  if(performance.now()-lastProgress>30000){lastProgress=performance.now();console.log(JSON.stringify({elapsedSeconds:Math.round((performance.now()-baseline)/1000),event:index+1,total:plan.events.length}));}
 }
 baseline=await waitUntil(plan.durationMs,baseline);
 await command('finish');started=false;
 const output=new URL('../../work/replay/native/',import.meta.url);await mkdir(output,{recursive:true,mode:0o700});
 await writeFile(new URL(session+'.json',output),await shell(['run-as','com.sporeward.app','cat','files/sporeward-replay-recording.json']),{mode:0o600});
 const result=process.argv.includes('--upload')&&!interrupted?await command('upload'):await status();
 console.log(JSON.stringify({finished:!interrupted,activity:result.activity?.id,fixes:result.fixCount,segments:result.segments,distanceMetres:Math.round(result.distanceMetres),maxGpsGapMs:result.maxGpsGapMs,maxSchedulerLatenessMs:Math.round(maxLateness),interruptionRecovery:recoveryResult,confirmedPoints:result.receipt?.encounters?result.receipt.encounters.confirmedVisitPoints+result.receipt.encounters.confirmedCleanupPoints:null,export:new URL(session+'.json',output).pathname},null,2));
}finally{if(started&&activity){try{await command('finish');}catch{console.error('Could not finish automatically. Finish the emulator recording manually.');}}}
