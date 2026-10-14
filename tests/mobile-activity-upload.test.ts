import { expect,it,vi } from 'vitest';
import { uploadActivity } from '../apps/mobile/src/server/upload';
import type { HealthRequest } from '../apps/mobile/src/server/client';
const payload={activity:{id:'test-recording',started:1,ended:2000000,sections:[{id:1,started:1,ended:2000000}]},totalFixes:1001,fixes:Array.from({length:1001},(_,i)=>({timestamp:1+i*1000,latitude:61.5,longitude:23.7,accuracy:5,segment:1}))};
it('uploads bounded batches before completion and sends no unneeded recorder metadata',async()=> {
 const progress=vi.fn(),receipt={id:payload.activity.id,status:'stored',fixCount:1001,distanceMetres:0,eligibleForGame:false,reasons:['below-minimum-distance'],receivedAt:2000001};
 const request=vi.fn<HealthRequest>().mockResolvedValueOnce(new Response('{}')).mockResolvedValueOnce(new Response('{}')).mockResolvedValueOnce(new Response(JSON.stringify(receipt)));
 expect(await uploadActivity(payload,{username:'tester',password:'test-password'},progress,request)).toEqual(receipt);
 expect(request.mock.calls.map(([url])=>url.split('/activities/')[1])).toEqual(['test-recording/chunks/0','test-recording/chunks/1','test-recording/complete']);
 expect(JSON.parse(request.mock.calls[0][1].body as string).fixes).toHaveLength(1000);expect(JSON.parse(request.mock.calls[1][1].body as string).fixes).toHaveLength(1);expect(progress).toHaveBeenLastCalledWith(2,2);
});
it('stops at an interrupted batch without falsely finalizing an upload',async()=> {
 const request=vi.fn<HealthRequest>().mockResolvedValueOnce(new Response('{}')).mockRejectedValueOnce(new Error('offline'));
 await expect(uploadActivity(payload,{username:'tester',password:'test-password'},()=>{},request)).rejects.toThrow('Upload interrupted');expect(request).toHaveBeenCalledTimes(2);
});
it('retries a partially accepted upload through the real API and retains one receipt after a server restart',async()=> {
 const {mkdtemp,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 const {createApp}=await import('../apps/server/src/app');const {ActivityStore}=await import('../apps/server/src/activity-store');
 const dir=await mkdtemp(join(tmpdir(),'sporeward-client-retry-')),credentials={username:'tester',password:'test-password'};
 let app=await createApp({auth:credentials,activityStore:new ActivityStore(dir,'tester',()=>2000001)});
 let interrupt=true;
 const request:HealthRequest=async(url,options)=> {
  const path=new URL(url).pathname;
  if(interrupt && path.endsWith('/chunks/1')) {interrupt=false;throw new Error('lost connection');}
  const response=await app.inject({method:options!.method as 'PUT'|'POST',url:path,headers:options!.headers as Record<string,string>,payload:options!.body as string});
  return new Response(response.body,{status:response.statusCode});
 };
 try {
  await expect(uploadActivity(payload,credentials,()=>{},request)).rejects.toThrow('Upload interrupted');
  await app.close();app=await createApp({auth:credentials,activityStore:new ActivityStore(dir,'tester',()=>2000001)});
  const receipt=await uploadActivity(payload,credentials,()=>{},request);
  expect(receipt.fixCount).toBe(1001);expect(receipt.status).toBe('stored');
  expect(await uploadActivity(payload,credentials,()=>{},request)).toEqual(receipt);
 } finally {await app.close();await rm(dir,{recursive:true,force:true});}
});
