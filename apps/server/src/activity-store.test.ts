import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach,expect,it } from 'vitest';
import { ActivityStore,UploadConflict,UploadIncomplete } from './activity-store';
import { activityReceipt,parseActivityChunk,type ActivityChunk } from '@sporeward/protocol';
import { createApp } from './app';
const now=1700001000000;
const payload=(count=2):ActivityChunk=>({activity:{id:'test-recording',started:now-1000000,ended:now-1,sections:[{id:1,started:now-1000000,ended:now-1}]},totalFixes:count,chunkCount:Math.max(1,Math.ceil(count/1000)),fixes:Array.from({length:Math.min(count,1000)},(_,i)=>({timestamp:now-1000000+i*1000,latitude:61.5+i*0.00001,longitude:23.7,accuracy:5,segment:1}))});
const directories:string[]=[];
afterEach(async()=>{for(const dir of directories.splice(0))await rm(dir,{recursive:true,force:true});});
async function store(){const dir=await mkdtemp(join(tmpdir(),'sporeward-upload-'));directories.push(dir);return {dir,store:new ActivityStore(dir,'tester',()=>now)};}
it('validates GPS timestamps, section membership and complete batch sizes',()=> {
 const p=payload();expect(parseActivityChunk(p,p.activity.id,0)).toEqual(p);
 for(const bad of [{...p,fixes:[{...p.fixes[0],latitude:91},p.fixes[1]]},{...p,fixes:[p.fixes[0],{...p.fixes[1],timestamp:p.fixes[0].timestamp}]},{...p,totalFixes:3},{...p,fixes:[{...p.fixes[0],segment:2},p.fixes[1]]}])expect(()=>parseActivityChunk(bad,p.activity.id,0)).toThrow();
});
it('stores retries once, refuses changed batches and persists receipts across restarts',async()=> {
 const {dir,store:s}=await store(),p=payload();
 await Promise.all([s.put(p.activity.id,0,p),s.put(p.activity.id,0,p)]);
 const first=await s.finish(p.activity.id);expect(first.fixCount).toBe(2);
 expect(await new ActivityStore(dir,'tester',()=>now+1000).finish(p.activity.id)).toEqual(first);
 await expect(s.put(p.activity.id,0,{...p,fixes:[{...p.fixes[0],longitude:24},p.fixes[1]]})).rejects.toBeInstanceOf(UploadConflict);
 await expect(new ActivityStore(dir,'another-tester').finish(p.activity.id)).rejects.toBeInstanceOf(UploadIncomplete);
});
it('requires every batch before issuing a receipt and checks distance without crossing gaps',async()=> {
 const {store:s}=await store(),p=payload(1001);await s.put(p.activity.id,0,p);await expect(s.finish(p.activity.id)).rejects.toBeInstanceOf(UploadIncomplete);
 const f={...p.fixes[999],timestamp:p.fixes[999].timestamp+1000,latitude:61.51};await s.put(p.activity.id,1,{...p,fixes:[f]});expect((await s.finish(p.activity.id)).fixCount).toBe(1001);
 const ordinary=payload(501);expect(activityReceipt(ordinary.activity,ordinary.fixes,now).eligibleForGame).toBe(true);
 const g=payload();g.fixes[1]={...g.fixes[1],timestamp:g.fixes[0].timestamp+3000,latitude:62};expect(activityReceipt(g.activity,g.fixes,now).distanceMetres).toBe(0);
 expect(activityReceipt(ordinary.activity,ordinary.fixes,now+86400000).reasons).toContain('outside-upload-window');
});
it('serves authenticated upload endpoints, rejecting malformed bodies and accepting idempotent completion',async()=> {
 const {store:s}=await store(),p=payload(),app=await createApp({activityStore:s,auth:{username:'tester',password:'test-password'}});
 try {
  const url='/activities/test-recording/chunks/0',headers={authorization:'Basic '+Buffer.from('tester:test-password').toString('base64')};
  expect((await app.inject({method:'PUT',url,payload:p})).statusCode).toBe(401);
  expect((await app.inject({method:'PUT',url,headers,payload:{}})).statusCode).toBe(400);
  expect((await app.inject({method:'PUT',url,headers,payload:p})).statusCode).toBe(200);
  const first=await app.inject({method:'POST',url:'/activities/test-recording/complete',headers});expect(first.statusCode).toBe(200);
  expect((await app.inject({method:'POST',url:'/activities/test-recording/complete',headers})).json()).toEqual(first.json());
 }finally{await app.close();}
});
