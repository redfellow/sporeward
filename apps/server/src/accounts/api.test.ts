import {test,expect,vi} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApp} from '../app.ts';
import {ActivityStore} from '../activity-store.ts';
import {WorldStore} from '../world-store.ts';
test('gateway access cannot replace a player session or merge same-ID uploads',async()=>{
 const root=await mkdtemp(join(tmpdir(),'sporeward-account-api-')),now=1800000000000,revoked=new Set<string>();
 const tokens=['a'.repeat(64),'b'.repeat(64)],players=[{id:'player-a',username:'alice',name:'Alice'},{id:'player-b',username:'bob',name:'Bob'}];
 const accounts={profiles:async(ids:string[])=>players.filter(p=>ids.includes(p.id)),authenticate:async(token:string)=>revoked.has(token)?null:players[tokens.indexOf(token)]??null,register:async()=>players[0],login:async()=>({token:tokens[0],expiresAt:now+10000,tester:players[0]}),logout:async(token:string)=>{revoked.add(token);}};
 const world=new WorldStore(join(root,'world'),()=>now);
 vi.spyOn(world,'standings').mockResolvedValue([{playerId:'outside-realm',points:999},{playerId:'player-b',points:300},{playerId:'player-a',points:100}]);
 const app=await createApp({auth:{username:'gateway',password:'test-gateway'},accounts,activityStoreFor:player=>new ActivityStore(join(root,'activities'),player,()=>now),worldStore:world});
 const gateway={authorization:'Basic '+Buffer.from('gateway:test-gateway').toString('base64')};
 try{
  expect((await app.inject({url:'/health',headers:gateway})).statusCode).toBe(200);
  expect((await app.inject({url:'/world',headers:gateway})).statusCode).toBe(401);
  expect((await app.inject({url:'/account/me',headers:{'x-sporeward-session':tokens[0]}})).statusCode).toBe(401);
  expect((await app.inject({method:'POST',url:'/account/login',headers:gateway,payload:{username:'alice',password:'test-password'}})).statusCode).toBe(200);
  for(const [i,token] of tokens.entries()){
   const headers={...gateway,'x-sporeward-session':token},batch={activity:{id:'same-outing',started:now-1000,ended:now,sections:[{id:1,started:now-1000,ended:now}]},totalFixes:1,chunkCount:1,fixes:[{timestamp:now-500,longitude:23.7+i*.001,latitude:61.5,segment:1,accuracy:5}]};
   expect((await app.inject({url:'/account/me',headers})).json().tester.id).toBe(players[i].id);
   expect((await app.inject({method:'PUT',url:'/activities/same-outing/chunks/0',headers,payload:batch})).statusCode).toBe(200);
   expect((await new ActivityStore(join(root,'activities'),players[i].id,()=>now).read('same-outing')).fixes[0].longitude).toBe(23.7+i*.001);
  }
  const scoreResponse=await app.inject({url:'/scores',headers:{...gateway,'x-sporeward-session':tokens[0]}});
  expect(scoreResponse.statusCode).toBe(200);expect(scoreResponse.json().entries.map((e:{name:string;rank:number})=>[e.name,e.rank])).toEqual([['Bob',1],['Alice',2]]);
  expect((await app.inject({url:'/scores',headers:gateway})).statusCode).toBe(401);
  const headers={...gateway,'x-sporeward-session':tokens[0]};expect((await app.inject({method:'POST',url:'/account/logout',headers})).statusCode).toBe(200);
  expect((await app.inject({url:'/world',headers})).statusCode).toBe(401);
  expect((await app.inject({url:'/account/me',headers:{...gateway,'x-sporeward-session':tokens[1]}})).statusCode).toBe(200);
 }finally{await app.close();await rm(root,{recursive:true,force:true});}
});
