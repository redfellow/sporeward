import {AccountError,type AccountStore,type Tester} from './accounts/store.ts';
import type {FastifyRequest} from 'fastify';
declare module 'fastify'{interface FastifyRequest{tester:Tester|null}}
import { createHash, timingSafeEqual } from 'node:crypto';
import Fastify, { type FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { parseActivityChunk, type HealthResponse } from '@sporeward/protocol';
import { WorldStore } from './world-store.ts';
import { ActivityStore,UploadConflict,UploadIncomplete } from './activity-store.ts';
export type AppOptions = { auth?: { username: string; password: string }; rateLimitMax?: number; logger?: boolean; accounts?:Pick<AccountStore,'authenticate'|'register'|'login'|'logout'>&Partial<Pick<AccountStore,'profiles'>>;activityStoreFor?:(player:string)=>ActivityStore;activityStore?: ActivityStore; worldStore?:WorldStore };
export async function createApp(options: AppOptions = {}): Promise<FastifyInstance> {
 const app=Fastify({bodyLimit:64*1024,logger:options.logger?{level:'info',redact:['req.headers.authorization','req.headers["x-sporeward-session"]','req.body.password','req.body.invite']}:false});
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
 app.decorateRequest('tester',null);
 const player=(req:FastifyRequest)=>req.tester?.playerId??req.tester?.id??options.auth?.username??'local';
 if(options.accounts){
  if(options.activityStore&&!options.activityStoreFor)throw new Error('Account-enabled uploads require per-player storage.');
  const accounts=options.accounts;
  app.addHook('onRequest',async(req,reply)=>{
   if(['/health','/account/login','/account/register'].includes(req.routeOptions.url??''))return;
   const token=req.headers['x-sporeward-session'];req.tester=typeof token==='string'?await accounts.authenticate(token):null;
   if(!req.tester)return reply.code(401).send({error:'Sign in to a tester account.'});
  });
  const body=(value:unknown,keys:string[])=>!!value&&typeof value==='object'&&!Array.isArray(value)&&keys.every(k=>typeof (value as Record<string,unknown>)[k]==='string');
  app.post('/account/register',{config:{rateLimit:{max:10,timeWindow:'1 minute'}}},async(req,reply)=>{
   if(!body(req.body,['invite','username','name','password']))return reply.code(400).send({error:'Invalid account details.'});
   const b=req.body as Record<string,string>;
   try{const tester=await accounts.register(b.invite,b.username,b.name,b.password);return reply.code(201).send({tester});}catch(e){if(e instanceof AccountError)return reply.code(400).send({error:e.message});throw e;}
  });
  app.post('/account/login',{config:{rateLimit:{max:10,timeWindow:'1 minute'}}},async(req,reply)=>{
   if(!body(req.body,['username','password']))return reply.code(400).send({error:'Invalid sign-in details.'});const b=req.body as Record<string,string>;
   try{return await accounts.login(b.username,b.password);}catch(e){if(e instanceof AccountError)return reply.code(401).send({error:e.message});throw e;}
  });
  app.get('/account/me',async req=>({tester:req.tester}));
  app.post('/account/logout',async req=>{await accounts.logout(req.headers['x-sporeward-session'] as string);return {status:'signed-out'};});
 }
 if(options.activityStore||options.activityStoreFor) {
  const storeFor=(req:FastifyRequest)=>options.activityStoreFor?.(player(req))??options.activityStore!;
  app.put<{Params:{id:string;index:string}}>('/activities/:id/chunks/:index',{bodyLimit:256*1024},async(req,reply)=>{
   let batch;
   const index=Number(req.params.index);
   try{if(!/^\d+$/.test(req.params.index))throw new Error();batch=parseActivityChunk(req.body,req.params.id,index);}catch{return reply.code(400).send({error:'Invalid activity batch.'});}
   try{await storeFor(req).put(req.params.id,index,batch);return {status:'stored',index};}catch(e){if(e instanceof UploadConflict)return reply.code(409).send({error:e.message});throw e;}
  });
  app.post<{Params:{id:string}}>('/activities/:id/complete',async(req,reply)=>{
   if(!/^[A-Za-z0-9-]{1,100}$/.test(req.params.id))return reply.code(400).send({error:'Invalid activity ID.'});
   const store=storeFor(req);
   try{const receipt=await store.finish(req.params.id);if(!options.worldStore)return receipt;const payload=await store.read(req.params.id);const encounters=await options.worldStore.process(player(req),payload.activity,payload.fixes,receipt);return {...receipt,encounters};}catch(e){if(e instanceof UploadIncomplete||e instanceof UploadConflict)return reply.code(409).send({error:e.message});if(e instanceof Error&&e.message==='Activity timestamps must be unique and increasing.')return reply.code(400).send({error:e.message});throw e;}
  });
 }
 if(options.worldStore) {
  const world=options.worldStore;
  app.get('/world',async req=>world.view(player(req)));
  app.post<{Params:{id:string}}>('/outings/:id/lab-offer',async(req,reply)=>{
   if(req.body!==undefined&&req.body!==null&&(typeof req.body!=='object'||Array.isArray(req.body)||Object.keys(req.body).length))return reply.code(400).send({error:'Lab offers use server-owned references; no request fields are accepted.'});
   return world.labOffer(player(req),req.params.id);
  });
  if(options.accounts?.profiles){const accounts=options.accounts;
   app.get('/scores',async()=>{
    const standings=await world.standings(),profiles=await accounts.profiles!(standings.map(s=>s.playerId));
    const visible=standings.filter(s=>profiles.some(p=>(p.playerId??p.id)===s.playerId)).slice(0,50);
    return {updatedAt:Date.now(),entries:visible.map((score,index)=>{const profile=profiles.find(p=>(p.playerId??p.id)===score.playerId)!;return {rank:index+1,playerId:profile.id,name:profile.name,username:profile.username,points:score.points};})};
   });
  }

  app.get<{Params:{id:string}}>('/activities/:id/encounters',async(req,reply)=>{
   if(!/^[A-Za-z0-9-]{1,100}$/.test(req.params.id))return reply.code(400).send({error:'Invalid activity ID.'});
   const recap=await world.activity(player(req),req.params.id);return recap??reply.code(404).send({error:'Activity has not been processed.'});
  });
  app.get<{Params:{id:string}}>('/activities/:id/footprints',async(req,reply)=>{
   if(!/^[A-Za-z0-9-]{1,100}$/.test(req.params.id))return reply.code(400).send({error:'Invalid activity ID.'});
   const footprints=await world.activityFootprints(player(req),req.params.id);return footprints??reply.code(404).send({error:'Activity has not been processed.'});
  });
 }
 app.get('/health',async():Promise<HealthResponse>=>({service:'sporeward',status:'ok',accounts:!!options.accounts}));
 return app;
}
