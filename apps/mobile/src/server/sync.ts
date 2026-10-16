import {AppState} from 'react-native';
import {uploadNotification} from './sync-notification';
import type {ActivityReceipt} from '@sporeward/protocol';
import * as store from '../recording/store';
import {loadCredentials} from './credentials';
import {ConnectionError} from './client';
import {uploadActivity} from './upload';
type Progress=(sent:number,total:number)=>void;
let retryTimer:ReturnType<typeof setTimeout>|undefined;
async function updatePendingNotification(){
 const c=await loadCredentials();const pending=await store.pendingUploads(c?.playerId??'legacy-local');
 const active=AppState.currentState==='active',running=jobs.size>0;
 const next=pending.length?Math.min(...pending.map(a=>a.retryAt??0)):0;
 await uploadNotification(pending.length,next,running,active);
 clearTimeout(retryTimer);
 if(active&&pending.length&&!running&&c)retryTimer=setTimeout(()=>{void syncPendingActivities().catch(()=>{});},Math.max(1000,next-Date.now()));
}
AppState.addEventListener('change',()=>{void updatePendingNotification().catch(()=>{});});
const jobs=new Map<string,{promise:Promise<ActivityReceipt>;listeners:Set<Progress>}>();
/** The durable outbox is written atomically with Finish. Concurrent UI/recovery
 * requests share one transfer; interrupted uploads remain safe to retry. */
export function syncActivity(id:string,progress:Progress=()=>{}):Promise<ActivityReceipt>{
 const existing=jobs.get(id);if(existing){existing.listeners.add(progress);return existing.promise;}
 const listeners=new Set([progress]);
 const promise=(async()=>{
  try{
   const credentials=await loadCredentials();if(!credentials)throw new ConnectionError('Configure the test server to confirm your score.');
   await store.assertOwner(id,credentials.playerId??'legacy-local');
   const saved=await store.uploadState(id);
   if(saved?.state==='uploaded'&&saved.receipt)return JSON.parse(saved.receipt) as ActivityReceipt;
   if(credentials.playerId&&!credentials.session)throw new ConnectionError('Sign in to your tester account again to upload. Your recording remains saved.');
   const activity=await store.activity(id);
   if(!activity||activity.status!=='finished'||activity.ended===null)throw new ConnectionError('Finish the activity before uploading.');
   await store.markUpload(id,'pending');
   void updatePendingNotification().catch(()=>{});
   const [fixes,sections]=await Promise.all([store.points(id),store.segments(id)]);
   const receipt=await uploadActivity({activity:{id,started:activity.started,ended:activity.ended,sections:sections.map(s=>({id:s.id,started:s.started,ended:s.ended??activity.ended!}))},totalFixes:fixes.length,fixes},credentials,(sent,total)=>{for(const listener of listeners)listener(sent,total);});
   await store.markUpload(id,'uploaded',receipt);return receipt;
  }catch(e){
   const message=e instanceof ConnectionError?e.message:'Upload interrupted. Your recording is saved; it will retry when the app is open and connected.';
   // Never replace another account's state on an ownership/authentication error.
   const c=await loadCredentials().catch(()=>null);
   if(c)try{await store.assertOwner(id,c.playerId??'legacy-local');await store.markUpload(id,'pending',null,message);await store.setUploadRetry(id,Date.now()+60000);}catch{}
   throw new ConnectionError(message);
  }
 })().finally(()=>{jobs.delete(id);void updatePendingNotification().catch(()=>{});});
 jobs.set(id,{promise,listeners});return promise;
}
let draining:Promise<void>|null=null;
export function syncPendingActivities():Promise<void>{
 if(draining)return draining;
 draining=(async()=>{
  const c=await loadCredentials();if(!c){await updatePendingNotification();return;}
  const pending=await store.pendingUploads(c.playerId??'legacy-local');
  for(const activity of pending){
   if((activity.retryAt??0)>Date.now())continue;
   try{await syncActivity(activity.id);}catch{break;}
  }
 })().finally(()=>{draining=null;void updatePendingNotification().catch(()=>{});});return draining;
}
