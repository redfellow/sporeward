import {signIn,savedSession} from '../server/session';
import {File,Paths} from 'expo-file-system';
import * as recorder from '../recording/recorder';
import * as store from '../recording/store';
import {SERVER_URL,requestHeaders} from '../server/client';
import {loadCredentials} from '../server/credentials';
import {uploadActivity} from '../server/upload';
import {summarize} from '../recording/model';
const enabled=typeof __DEV__!=='undefined'&&__DEV__&&/^http:\/\/127\.0\.0\.1:[0-9]+$/.test(SERVER_URL);
export type ReplayCommand={action:'prepare'|'start'|'pause'|'resume'|'gps-off'|'gps-on'|'finish'|'upload'|'reset-world'|'sign-in'|'status'|'check-clock';session:string;request:string;activity:string|null};
type Control={session:string|null;activity:string|null;request:string|null;action:string|null;gpsAvailable:boolean;error:string|null;position?:{longitude:number;latitude:number}};
let control:Control={session:null,activity:null,request:null,action:null,gpsAvailable:true,error:null};
let restored=false;
const completedRequests=new Set<string>();
async function replayFetch(path:string,options:RequestInit){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try{return await fetch(SERVER_URL+path,{...options,signal:controller.signal});}finally{clearTimeout(timer);}
}
const statusFile=()=>new File(Paths.document,'sporeward-replay-status.json');
export function replayCommand(url:string|null):ReplayCommand|null {
 if(!enabled||!url)return null;
 try{const u=new URL(url),action=u.pathname.slice(1),session=u.searchParams.get('session'),request=u.searchParams.get('request'),activity=u.searchParams.get('activity');
  if(u.protocol!=='sporeward:'||u.hostname!=='replay'||!['prepare','start','pause','resume','gps-off','gps-on','finish','upload','reset-world','sign-in','status','check-clock'].includes(action)||!session||!/^[a-f0-9]{32}$/.test(session)||!request||!/^[a-f0-9]{32}$/.test(request)||activity!==null&&!/^[A-Za-z0-9-]{1,100}$/.test(activity))return null;
  return {action:action as ReplayCommand['action'],session,request,activity};
 }catch{return null;}
}
export async function restoreReplayControl(){
 if(!enabled||restored)return;restored=true;
 try{const file=statusFile();if(!file.exists)return;const saved=JSON.parse(file.textSync());const a=await store.current();
  if(saved.version===1&&saved.control?.session&&(!a||a.id===saved.control.activity)){control=saved.control;if(a?.status==='recording'&&!control.gpsAvailable)await recorder.setReplayGpsAvailable(false);}
 }catch{control={session:null,activity:null,request:null,action:null,gpsAvailable:true,error:null};}
}
export async function publishReplayStatus(){
 if(!enabled)return;
 const a=(await store.recent()).find(a=>a.id===control.activity)??await store.current();
 const fixes=a?await store.points(a.id):[],segments=a?await store.segments(a.id):[],stats=summarize(fixes),upload=a?await store.uploadState(a.id):null;
 const tester=await savedSession();
 const file=statusFile();file.create({overwrite:true});file.write(JSON.stringify({version:1,server:SERVER_URL,playerId:tester?.tester.id??null,updatedAt:Date.now(),control,activity:a,fixCount:fixes.length,segments:segments.length,maxGpsGapMs:stats.maxGap,distanceMetres:stats.meters,receipt:upload?.receipt?JSON.parse(upload.receipt):null}));
}
/** Only debug builds pointed at an isolated loopback API accept replay commands. */
export async function applyReplayCommand(command:ReplayCommand){
 if(!enabled)throw new Error('Native replay requires a development build using a loopback test API.');
 await restoreReplayControl();if(command.request===control.request||completedRequests.has(command.request))return;
 try{
  const a=await store.current();
  if(command.action==='prepare'){
   if(a)throw new Error('Finish the emulator recording before preparing its location.');
   control.position=await recorder.prepareReplayPosition();
  }else if(command.action==='check-clock'){
   const credentials=await loadCredentials();if(!credentials)throw new Error('Configure the isolated gateway first.');
   const response=await replayFetch('/replay/environment',{headers:requestHeaders(credentials)});
   if(!response.ok)throw new Error('Cannot check the isolated replay clock.');
   const environment=await response.json();
   if(environment.mode!=='native-replay'||environment.clock!=='wall')throw new Error('Reset the accelerated replay world before recording normal-speed GPS.');
  }else if(command.action==='start'){
   if(a)throw new Error('Finish the existing emulator recording before starting a replay.');
   control={session:command.session,activity:null,request:null,action:null,gpsAvailable:true,error:null};
   await recorder.start();control.activity=(await store.current())!.id;
  }else if(command.action==='sign-in'){
   if(a)throw new Error('Finish the emulator activity before configuring its account.');
   const file=new File(Paths.document,'sporeward-replay-account.json');
   try{const value=JSON.parse(file.textSync());if(typeof value.username!=='string'||typeof value.password!=='string'||value.username.length>40||value.password.length>256)throw new Error('Invalid private replay account file.');
    const credentials=await loadCredentials();if(!credentials)throw new Error('Configure the isolated gateway first.');
    await signIn(credentials,value.username,value.password);
   }finally{if(file.exists)file.delete();}
  }else if(command.action==='reset-world'){
   if(a)throw new Error('Finish the emulator activity before resetting its world.');
   const credentials=await loadCredentials();if(!credentials)throw new Error('Configure disposable local tester credentials.');
   const headers=requestHeaders(credentials);
   const environment=await replayFetch('/replay/environment',{headers});
   if(!environment.ok||(await environment.json()).mode!=='native-replay')throw new Error('API is not the dedicated native replay environment.');
   const reset=await replayFetch('/replay/reset',{method:'POST',headers});if(!reset.ok)throw new Error('Native replay world reset failed.');
  }else if(command.action!=='status'){
   if(control.session!==command.session||control.activity!==command.activity)throw new Error('Replay command belongs to another recording.');
   if(command.action==='upload'){
    const activity=(await store.recent()).find(a=>a.id===control.activity);
    if(!activity||activity.status!=='finished'||activity.ended===null)throw new Error('Finish the replay before upload.');
    const credentials=await loadCredentials();if(!credentials)throw new Error('Configure disposable local tester credentials.');
    await store.assertOwner(activity.id,credentials.playerId??'legacy-local');
    const [fixes,sections]=await Promise.all([store.points(activity.id),store.segments(activity.id)]);
    const receipt=await uploadActivity({activity:{id:activity.id,started:activity.started,ended:activity.ended,sections:sections.map(s=>({id:s.id,started:s.started,ended:s.ended??activity.ended!}))},totalFixes:fixes.length,fixes},credentials);
    await store.markUpload(activity.id,'uploaded',receipt);
   }else{
    if(!a||a.id!==command.activity)throw new Error('Replay activity is no longer active.');
    switch(command.action){
     case 'pause':await recorder.pause();break;
     case 'resume':await recorder.start(true);control.gpsAvailable=true;break;
     case 'gps-off':await recorder.setReplayGpsAvailable(false);control.gpsAvailable=false;break;
     case 'gps-on':await recorder.setReplayGpsAvailable(true);control.gpsAvailable=true;break;
     case 'finish':await recorder.pause(true,false);control.gpsAvailable=true;break;
    }
   }
  }
  control.request=command.request;control.action=command.action;control.error=null;
 }catch(e){control.request=command.request;control.action=command.action;control.error=e instanceof Error?e.message:String(e);}
 completedRequests.add(command.request);if(completedRequests.size>256)completedRequests.delete(completedRequests.values().next().value!);
 await publishReplayStatus();
 if(command.action==='finish'&&control.error===null){const activity=(await store.recent()).find(a=>a.id===control.activity)!;const [fixes,segments,diagnostics]=await Promise.all([store.points(activity.id),store.segments(activity.id),store.recordingDiagnostics(activity.id)]);const file=new File(Paths.document,'sporeward-replay-recording.json');file.create({overwrite:true});file.write(JSON.stringify({version:3,activity,segments,fixes,diagnostics}));}
}
