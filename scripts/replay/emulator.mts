import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {randomBytes} from 'node:crypto';
import {parseReplayTrack} from '../../packages/protocol/src/replay.ts';
import {nativeReplayPlan} from '../../apps/server/src/replay/native-plan.ts';
const file=process.argv[2];if(!file)throw new Error('Usage: npm run replay:emulator -- track.json [--from=SECONDS] [--duration=SECONDS] [--interrupt-after=SECONDS] [--upload]');
const serial=process.argv.find(a=>a.startsWith('--device='))?.slice(9)??'emulator-5554';
if(!/^emulator-\d+$/.test(serial))throw new Error('Native replay targets Android emulators only.');
const seconds=(name:string,fallback:number)=>{const option=process.argv.find(a=>a.startsWith('--'+name+'='));const value=option?Number(option.split('=')[1]):fallback;if(!Number.isFinite(value)||value<0||!Number.isSafeInteger(value*1000))throw new Error('Invalid '+name);return value*1000;};
const track=parseReplayTrack(JSON.parse(await readFile(file,'utf8'))),plan=nativeReplayPlan(track,seconds('from',0),seconds('duration',(track.ended-track.started)/1000));
const interruptOption=process.argv.some(a=>a.startsWith('--interrupt-after='));const interruptAfter=interruptOption?seconds('interrupt-after',0):null;
if(interruptAfter!==null&&(interruptAfter<1000||interruptAfter>=plan.durationMs))throw new Error('interrupt-after must be at least 1 second and before the replay duration ends.');
const adbPath=process.env.ADB_PATH??join(process.env.ANDROID_HOME??join(homedir(),'Library/Android/sdk'),'platform-tools','adb');
const exec=promisify(execFile),adb=async(args:string[])=>{const r=await exec(adbPath,['-s',serial,...args],{timeout:20000,maxBuffer:8*1024*1024});return r.stdout;};
const quote=(s:string)=>"'"+s.replaceAll("'","'\\''")+"'";
const shell=(args:string[])=>adb(['shell',args.map(quote).join(' ')]);
if((await shell(['getprop','ro.kernel.qemu'])).trim()!=='1')throw new Error('Device does not identify as an emulator.');
const session=randomBytes(16).toString('hex');let activity:string|null=null,started=false,interrupted=false,recoveryResult:{fixesBefore:number;fixesAfter:number;segments:number}|null=null;
process.once('SIGINT',()=>{interrupted=true;});process.once('SIGTERM',()=>{interrupted=true;});
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const metroPort=Number(process.argv.find(a=>a.startsWith('--metro-port='))?.slice(13)??8081);
if(!Number.isInteger(metroPort)||metroPort<1||metroPort>65535)throw new Error('Invalid Metro port.');
async function launchDevClient(){await shell(['am','start','-a','android.intent.action.VIEW','-d','sporeward://expo-development-client/?url='+encodeURIComponent('http://localhost:'+metroPort),'com.sporeward.app']);}
async function status(){const raw=await shell(['run-as','com.sporeward.app','cat','files/sporeward-replay-status.json']);const value=JSON.parse(raw);if(value.version!==1||!/^http:\/\/127\.0\.0\.1:[0-9]+$/.test(value.server))throw new Error('Emulator needs the replay-enabled development build and isolated loopback API.');return value;}
async function command(action:string){
 const request=randomBytes(16).toString('hex'),url=new URL('sporeward://replay/'+action);url.searchParams.set('session',session);url.searchParams.set('request',request);if(activity)url.searchParams.set('activity',activity);
 const dispatch=()=>shell(['am','start','-a','android.intent.action.VIEW','-d',url.toString(),'com.sporeward.app']);
 await dispatch();let nextDispatch=Date.now()+10000;
 const deadline=Date.now()+60000;
 while(Date.now()<deadline){if(Date.now()>=nextDispatch){await dispatch();nextDispatch=Date.now()+10000;}try{const value=await status();if(value.control.request===request){if(value.control.error)throw new Error(value.control.error);return value;}}catch(e){if(e instanceof Error&&!(e.message.includes('ENOENT')||e.message.includes('JSON')||e.message.includes('No such file')))throw e;}await wait(150);}
 throw new Error('Native replay command timed out: '+action);
}
async function fix(longitude:number,latitude:number){await adb(['emu','geo','fix',String(longitude),String(latitude)]);}
async function waitForJavascript(){
 const deadline=Date.now()+60000;
 while(Date.now()<deadline){
  const log=await adb(['logcat','-d','-t','500']);
  if(log.includes('ReactNativeJS: Running "main"'))return;
  if(log.includes('Unable to load script.')||log.includes('Maximum call stack size exceeded'))throw new Error('Android development client failed to reload its JavaScript bundle after force-stop.');
  await wait(250);
 }
 throw new Error('Timed out waiting for the Android JavaScript bundle after force-stop.');
}
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
