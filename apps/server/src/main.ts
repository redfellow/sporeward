import { createApp } from './app.ts';
const host=process.env.HOST??'127.0.0.1',port=Number(process.env.PORT??3001);
const username=process.env.AUTH_USERNAME,password=process.env.AUTH_PASSWORD;
if(!Number.isInteger(port)||port<1||port>65535) throw new Error('PORT must be between 1 and 65535.');
if((!!username!==!!password)||((process.env.NODE_ENV==='production'||!['127.0.0.1','::1'].includes(host))&&(!username||!password))) throw new Error('AUTH_USERNAME and AUTH_PASSWORD are required for production or network-accessible servers.');
const app=await createApp({logger:true,auth:username&&password?{username,password}:undefined});
await app.listen({host,port});
for(const signal of ['SIGINT','SIGTERM'] as const) process.once(signal,async()=>{await app.close();});
