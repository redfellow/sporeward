import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID,randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
import {PostgresWorldPersistence} from '../../apps/server/src/database/world.ts';
import {AccountStore} from '../../apps/server/src/accounts/store.ts';
import {WorldStore} from '../../apps/server/src/world-store.ts';
import {ActivityStore} from '../../apps/server/src/activity-store.ts';
import {createApp} from '../../apps/server/src/app.ts';
import {tampereWorldFixtures} from '../../apps/server/src/spatial/tampere.ts';
import {parseReplayTrack,rebaseReplay} from '../../packages/protocol/src/replay.ts';
const url=process.env.DATABASE_URL;if(!url)throw new Error('Set DATABASE_URL to the isolated replay database.');
const id='group-check-'+randomUUID(),root=await mkdtemp(join(tmpdir(),'sporeward-group-'));let now=1800000000000;
const database=new PostgresWorldPersistence(url,id,()=>now),accounts=new AccountStore(database.pool,id,()=>now),{fixtures,access}=await tampereWorldFixtures();
const world=new WorldStore('',()=>now,()=>fixtures,{persistence:database,spatial:access.cells,seed:73});
const app=await createApp({auth:{username:'group-gateway',password:'disposable-group-check'},accounts,activityStoreFor:player=>new ActivityStore(root,player,()=>now),worldStore:world});
const gateway={authorization:'Basic '+Buffer.from('group-gateway:disposable-group-check').toString('base64')},sessions=[];
try{
 const track=parseReplayTrack(JSON.parse(await readFile(process.argv[2]??'work/replay/field-phone.json','utf8')));
 for(let i=0;i<5;i++){
  const invite=await accounts.invite(),username='rider-'+i,password=randomBytes(18).toString('hex');
  const joined=await app.inject({method:'POST',url:'/account/register',headers:gateway,payload:{invite:invite.token,username,name:'Rider '+(i+1),password}});assert.equal(joined.statusCode,201);
  const login=await app.inject({method:'POST',url:'/account/login',headers:gateway,payload:{username,password}});assert.equal(login.statusCode,200);sessions.push(login.json());
 }
 await world.view(sessions[0].tester.id);
 for(const [i,session] of sessions.entries()){
  const p=rebaseReplay(track,1800000000000+60000+i*60000,'shared-outing-id');now=p.activity.ended+(i===4?30*60000:0);
  const headers={...gateway,'x-sporeward-session':session.token};
  for(let retry=0;retry<2;retry++){
   for(let chunk=0;chunk<p.chunkCount;chunk++){const stored=await app.inject({method:'PUT',url:`/activities/${p.activity.id}/chunks/${chunk}`,headers,payload:{...p,fixes:p.fixes.slice(chunk*1000,(chunk+1)*1000)}});assert.equal(stored.statusCode,200);}
   const complete=await app.inject({method:'POST',url:`/activities/${p.activity.id}/complete`,headers});assert.equal(complete.statusCode,200);assert.equal(complete.json().encounters.confirmedVisitPoints,100);
  }
 }
 now+=13*3600000;await world.view(sessions[0].tester.id);
 for(const session of sessions){const recap=await app.inject({url:'/activities/shared-outing-id/encounters',headers:{...gateway,'x-sporeward-session':session.token}});assert.equal(recap.json().confirmedCleanupPoints,100);}
 const scoreboard=await app.inject({url:'/scores',headers:{...gateway,'x-sporeward-session':sessions[0].token}});assert.equal(scoreboard.statusCode,200);assert.equal(scoreboard.json().entries.length,5);assert.ok(scoreboard.json().entries.every((e:{points:number})=>e.points===200));
 console.log(JSON.stringify({accounts:5,sameIdUploadsIsolated:true,delayedUpload:true,retriesIdempotent:true,sharedCleanupBonus:true,scoreboard:scoreboard.json().entries.map((e:{name:string;points:number})=>({name:e.name,points:e.points}))}));
}finally{
 await app.close();const c=await database.pool.connect();try{await c.query('BEGIN');for(const table of ['sw_bonus_owners','sw_contributions','sw_footprints'])await c.query(`DELETE FROM ${table} WHERE world_id=$1`,[id]);await c.query('DELETE FROM sw_worlds WHERE id=$1',[id]);await c.query('DELETE FROM sw_sessions s USING sw_testers t WHERE s.tester_id=t.id AND t.realm=$1',[id]);await c.query('DELETE FROM sw_invites WHERE realm=$1',[id]);await c.query('DELETE FROM sw_testers WHERE realm=$1',[id]);await c.query('COMMIT');}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();await database.close();await rm(root,{recursive:true,force:true});}
}
