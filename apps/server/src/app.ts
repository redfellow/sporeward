import { createHash, timingSafeEqual } from 'node:crypto';
import Fastify, { type FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { parseActivityChunk, type HealthResponse } from '@sporeward/protocol';
import { WorldStore } from './world-store.ts';
import { ActivityStore,UploadConflict,UploadIncomplete } from './activity-store.ts';
export type AppOptions = { auth?: { username: string; password: string }; rateLimitMax?: number; logger?: boolean; activityStore?: ActivityStore; worldStore?:WorldStore };
export async function createApp(options: AppOptions = {}): Promise<FastifyInstance> {
 const app=Fastify({bodyLimit:64*1024,logger:options.logger?{level:'info',redact:['req.headers.authorization']}:false});
 await app.register(rateLimit,{max:options.rateLimitMax??120,timeWindow:'1 minute'});
 if(options.auth) {
  if(!options.auth.username || options.auth.username.includes(':') || !options.auth.password) throw new Error('Valid Basic Auth credentials are required.');
  const expected=createHash('sha256').update(`${options.auth.username}:${options.auth.password}`).digest();
  app.addHook('onRequest',async(request,reply)=> {
   const header=request.headers.authorization;
   const match=header && /^Basic ([A-Za-z0-9+/]+={0,2})$/i.exec(header);
   const supplied=match && match[1].length<=1024 ? createHash('sha256').update(Buffer.from(match[1],'base64')).digest() : null;
   if(!supplied || !timingSafeEqual(expected,supplied)) return reply.header('WWW-Authenticate','Basic realm="Sporeward field test", charset="UTF-8"').code(401).send({error:'Unauthorized'});
  });
 }
 if(options.activityStore) {
  const store=options.activityStore;
  app.put<{Params:{id:string;index:string}}>('/activities/:id/chunks/:index',{bodyLimit:256*1024},async(req,reply)=>{
   let batch;
   const index=Number(req.params.index);
   try{if(!/^\d+$/.test(req.params.index))throw new Error();batch=parseActivityChunk(req.body,req.params.id,index);}catch{return reply.code(400).send({error:'Invalid activity batch.'});}
   try{await store.put(req.params.id,index,batch);return {status:'stored',index};}catch(e){if(e instanceof UploadConflict)return reply.code(409).send({error:e.message});throw e;}
  });
  app.post<{Params:{id:string}}>('/activities/:id/complete',async(req,reply)=>{
   if(!/^[A-Za-z0-9-]{1,100}$/.test(req.params.id))return reply.code(400).send({error:'Invalid activity ID.'});
   try{const receipt=await store.finish(req.params.id);if(!options.worldStore)return receipt;const payload=await store.read(req.params.id);const encounters=await options.worldStore.process(options.auth?.username??'local',payload.activity,payload.fixes,receipt);return {...receipt,encounters};}catch(e){if(e instanceof UploadIncomplete||e instanceof UploadConflict)return reply.code(409).send({error:e.message});if(e instanceof Error&&e.message==='Activity timestamps must be unique and increasing.')return reply.code(400).send({error:e.message});throw e;}
  });
 }
 if(options.worldStore) {
  const world=options.worldStore,player=options.auth?.username??'local';
  app.get('/world',async()=>world.view(player));
  app.get<{Params:{id:string}}>('/activities/:id/encounters',async(req,reply)=>{
   if(!/^[A-Za-z0-9-]{1,100}$/.test(req.params.id))return reply.code(400).send({error:'Invalid activity ID.'});
   const recap=await world.activity(player,req.params.id);return recap??reply.code(404).send({error:'Activity has not been processed.'});
  });
 }
 app.get('/health',async():Promise<HealthResponse>=>({service:'sporeward',status:'ok'}));
 return app;
}
