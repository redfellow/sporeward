import { UPLOAD_BATCH_SIZE,parseEncounterRecap,type ActivityChunk,type ActivityReceipt } from '@sporeward/protocol';
import { authorization,ConnectionError,SERVER_URL,type Credentials,type HealthRequest } from './client';
export async function uploadActivity(payload:Omit<ActivityChunk,'fixes'|'chunkCount'> & {fixes:ActivityChunk['fixes']},credentials:Credentials,progress:(sent:number,total:number)=>void=()=>{},request:HealthRequest=fetch):Promise<ActivityReceipt> {
 const chunkCount=Math.max(1,Math.ceil(payload.fixes.length/UPLOAD_BATCH_SIZE)),header=authorization(credentials);
 async function send(path:string,method:string,body:unknown) {
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try {
   const response=await request(SERVER_URL+path,{method,headers:{Authorization:header,'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal,redirect:'error'});
   if(response.status===401)throw new ConnectionError('Authentication failed. Configure tester credentials again.');
   if(response.status===429)throw new ConnectionError('Too many requests. Wait a minute and retry the upload.');
   if(response.status===409)throw new ConnectionError('The server has incomplete or different data for this activity.');
   if(response.status===400||response.status===413)throw new ConnectionError('The server rejected this recording. Keep its local export for inspection.');
   if(!response.ok)throw new ConnectionError('The test server is unavailable. Your recording remains on this phone.');
   return await response.json() as unknown;
  }catch(e){if(e instanceof ConnectionError)throw e;throw new ConnectionError('Upload interrupted. Your recording remains on this phone; retry when connected.');}finally{clearTimeout(timer);}
 }
 for(let index=0;index<chunkCount;index++) {
  await send(`/activities/${encodeURIComponent(payload.activity.id)}/chunks/${index}`,'PUT',{activity:payload.activity,totalFixes:payload.fixes.length,chunkCount,fixes:payload.fixes.slice(index*UPLOAD_BATCH_SIZE,(index+1)*UPLOAD_BATCH_SIZE)});
  progress(index+1,chunkCount);
 }
 const receipt=await send(`/activities/${encodeURIComponent(payload.activity.id)}/complete`,'POST',{});
 if(typeof receipt!=='object'||!receipt||!('status' in receipt)||receipt.status!=='stored'||!('id' in receipt)||receipt.id!==payload.activity.id||!('fixCount' in receipt)||receipt.fixCount!==payload.fixes.length||!('eligibleForGame' in receipt)||typeof receipt.eligibleForGame!=='boolean'||!('distanceMetres' in receipt)||typeof receipt.distanceMetres!=='number'||!Number.isFinite(receipt.distanceMetres)||!('reasons' in receipt)||!Array.isArray(receipt.reasons)||receipt.reasons.some(x=>typeof x!=='string')||!('receivedAt' in receipt)||typeof receipt.receivedAt!=='number')throw new ConnectionError('Unexpected server receipt. Retry or keep the local export.');
 if('encounters' in receipt&&receipt.encounters!==undefined){try{parseEncounterRecap(receipt.encounters,payload.activity.id);}catch{throw new ConnectionError('Unexpected encounter recap. Retry or keep the local export.');}}
 return receipt as ActivityReceipt;
}
