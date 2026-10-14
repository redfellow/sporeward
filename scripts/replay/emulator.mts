import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {randomBytes} from 'node:crypto';
import {parseReplayTrack} from '../../packages/protocol/src/replay.ts';
import {nativeReplayPlan} from '../../apps/server/src/replay/native-plan.ts';
const file=process.argv[2];if(!file)throw new Error('Usage: npm run replay:emulator -- track.json [--from=SECONDS] [--duration=SECONDS] [--upload]');
const serial=process.argv.find(a=>a.startsWith('--device='))?.slice(9)??'emulator-5554';
if(!/^emulator-\d+$/.test(serial))throw new Error('Native replay targets Android emulators only.');
const seconds=(name:string,fallback:number)=>{const option=process.argv.find(a=>a.startsWith('--'+name+'='));const value=option?Number(option.split('=')[1]):fallback;if(!Number.isFinite(value)||value<0||!Number.isSafeInteger(value*1000))throw new Error('Invalid '+name);return value*1000;};
const track=parseReplayTrack(JSON.parse(await readFile(file,'utf8'))),plan=nativeReplayPlan(track,seconds('from',0),seconds('duration',(track.ended-track.started)/1000));
const adbPath=process.env.ADB_PATH??join(process.env.ANDROID_HOME??join(homedir(),'Library/Android/sdk'),'platform-tools','adb');
const exec=promisify(execFile),adb=async(args:string[])=>{const r=await exec(adbPath,['-s',serial,...args],{timeout:20000,maxBuffer:8*1024*1024});return r.stdout;};
const quote=(s:string)=>"'"+s.replaceAll("'","'\\''")+"'";
const shell=(args:string[])=>adb(['shell',args.map(quote).join(' ')]);
if((await shell(['getprop','ro.kernel.qemu'])).trim()!=='1')throw new Error('Device does not identify as an emulator.');
const session=randomBytes(16).toString('hex');let activity:string|null=null,started=false,interrupted=false;
process.once('SIGINT',()=>{interrupted=true;});process.once('SIGTERM',()=>{interrupted=true;});
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
async function status(){const raw=await shell(['run-as','com.sporeward.app','cat','files/sporeward-replay-status.json']);const value=JSON.parse(raw);if(value.version!==1||!/^http:\/\/127\.0\.0\.1:[0-9]+$/.test(value.server))throw new Error('Emulator needs the replay-enabled development build and isolated loopback API.');return value;}
async function command(action:string){
 const request=randomBytes(16).toString('hex'),url=new URL('sporeward://replay/'+action);url.searchParams.set('session',session);url.searchParams.set('request',request);if(activity)url.searchParams.set('activity',activity);
 await shell(['am','start','-a','android.intent.action.VIEW','-d',url.toString(),'com.sporeward.app']);
 const deadline=Date.now()+20000;
 while(Date.now()<deadline){try{const value=await status();if(value.control.request===request){if(value.control.error)throw new Error(value.control.error);return value;}}catch(e){if(e instanceof Error&&!(e.message.includes('ENOENT')||e.message.includes('JSON')||e.message.includes('No such file')))throw e;}await wait(150);}
 throw new Error('Native replay command timed out: '+action);
}
async function fix(longitude:number,latitude:number){await adb(['emu','geo','fix',String(longitude),String(latitude)]);}
try{
 const initial=await status();if(initial.activity&&initial.activity.status!=='finished')throw new Error('Finish the existing emulator activity first.');
 if(!process.argv.includes('--keep-world'))await command('reset-world');
 await fix(plan.first.longitude,plan.first.latitude);
 const recording=await command('start');activity=recording.activity.id;started=true;
 if(plan.initiallyPaused)await command('pause');
 const baseline=performance.now();let lastProgress=0,maxLateness=0;
 console.log('Native replay started at 1× on '+serial+'; using today’s Android recorder clock.');
 for(const [index,event] of plan.events.entries()){
  while(performance.now()-baseline<event.at&&!interrupted)await wait(Math.min(100,event.at-(performance.now()-baseline)));
  if(interrupted)break;maxLateness=Math.max(maxLateness,performance.now()-baseline-event.at);
  if(event.action==='fix')await fix(event.fix!.longitude,event.fix!.latitude);else await command(event.action);
  if(performance.now()-lastProgress>30000){lastProgress=performance.now();console.log(JSON.stringify({elapsedSeconds:Math.round((performance.now()-baseline)/1000),event:index+1,total:plan.events.length}));}
 }
 while(!interrupted&&performance.now()-baseline<plan.durationMs)await wait(Math.min(100,plan.durationMs-(performance.now()-baseline)));
 await command('finish');started=false;
 const output=new URL('../../work/replay/native/',import.meta.url);await mkdir(output,{recursive:true,mode:0o700});
 await writeFile(new URL(session+'.json',output),await shell(['run-as','com.sporeward.app','cat','files/sporeward-replay-recording.json']),{mode:0o600});
 const result=process.argv.includes('--upload')&&!interrupted?await command('upload'):await status();
 console.log(JSON.stringify({finished:!interrupted,activity:result.activity?.id,fixes:result.fixCount,segments:result.segments,distanceMetres:Math.round(result.distanceMetres),maxGpsGapMs:result.maxGpsGapMs,maxSchedulerLatenessMs:Math.round(maxLateness),confirmedPoints:result.receipt?.encounters?result.receipt.encounters.confirmedVisitPoints+result.receipt.encounters.confirmedCleanupPoints:null,export:new URL(session+'.json',output).pathname},null,2));
}finally{if(started&&activity){try{await command('finish');}catch{console.error('Could not finish automatically. Finish the emulator recording manually.');}}}
