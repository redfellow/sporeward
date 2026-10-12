import { createHash, timingSafeEqual } from 'node:crypto';
import Fastify, { type FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import type { HealthResponse } from '@sporeward/protocol';
export type AppOptions = { auth?: { username: string; password: string }; rateLimitMax?: number; logger?: boolean };
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
 app.get('/health',async():Promise<HealthResponse>=>({service:'sporeward',status:'ok'}));
 return app;
}
