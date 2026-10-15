import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {PostgresWorldPersistence} from '../../apps/server/src/database/world.ts';
import {AccountStore} from '../../apps/server/src/accounts/store.ts';
import {ActivityStore} from '../../apps/server/src/activity-store.ts';
import {WorldStore} from '../../apps/server/src/world-store.ts';
import {createApp} from '../../apps/server/src/app.ts';
import {parseReplayTrack,rebaseReplay} from '../../packages/protocol/src/replay.ts';
const url=process.env.DATABASE_URL;if(!url)throw new Error('Set DATABASE_URL to the isolated replay database.');
const realm='owner-check-'+randomUUID(),root=await mkdtemp(join(tmpdir(),'sporeward-owner-'));let now=1800000000000;
const database=new PostgresWorldPersistence(url,realm,()=>now),accounts=new AccountStore(database.pool,realm,()=>now),world=new WorldStore('',()=>now,undefined,{persistence:database});
const legacy='previous-owner',oldStore=new ActivityStore(root,legacy,()=>now);
let app:Awaited<ReturnType<typeof createApp>>|null=null;
try{
 await world.view(legacy);
 const track=parseReplayTrack(JSON.parse(await readFile(process.argv[2]??'work/replay/field-phone.json','utf8'))),p=rebaseReplay(track,now+60000,'existing-outing');now=p.activity.ended;
 for(let i=0;i<p.chunkCount;i++)await oldStore.put(p.activity.id,i,{...p,fixes:p.fixes.slice(i*1000,(i+1)*1000)});
 const receipt=await oldStore.finish(p.activity.id),original=await world.process(legacy,p.activity,p.fixes,receipt),before=await world.view(legacy);assert.equal(original.confirmedVisitPoints,100);
 const invitation=await accounts.invite(undefined,legacy),tester=await accounts.register(invitation.token,'owner','Existing Owner','only-for-this-owner-check');assert.equal(tester.playerId,legacy);assert.notEqual(tester.id,legacy);
 const login=await accounts.login('owner','only-for-this-owner-check');
 app=await createApp({accounts,activityStoreFor:player=>new ActivityStore(root,player,()=>now),worldStore:world});
 const headers={'x-sporeward-session':login.token};
 const recap=await app.inject({url:'/activities/existing-outing/encounters',headers});assert.equal(recap.statusCode,200);assert.deepEqual(recap.json(),original);
 const retried=await app.inject({method:'POST',url:'/activities/existing-outing/complete',headers});assert.equal(retried.statusCode,200);assert.deepEqual(retried.json().encounters,original);
 const after=await app.inject({url:'/world',headers});assert.equal(after.statusCode,200);assert.deepEqual(after.json(),before);
 const scores=await app.inject({url:'/scores',headers});assert.equal(scores.json().entries[0].playerId,tester.id);assert.equal(scores.json().entries[0].points,100);
 const duplicate=await accounts.invite(undefined,legacy);await assert.rejects(accounts.register(duplicate.token,'another-owner','Another','only-for-this-owner-check'));
 const ordinary=await accounts.invite();const cannotClaim=await app.inject({method:'POST',url:'/account/register',payload:{invite:ordinary.token,username:'ordinary',name:'Ordinary',password:'only-for-this-owner-check',legacyOwner:legacy}});assert.equal(cannotClaim.statusCode,201);assert.notEqual(cannotClaim.json().tester.playerId,legacy);
 console.log(JSON.stringify({legacyUploadReadable:true,contributionIdentityPreserved:true,cooldownPreserved:true,retryAwardsUnchanged:true,scoreboardUsesAccount:true,duplicateOwnerRejected:true,clientCannotChooseLegacyOwner:true}));
}finally{
 await app?.close();const c=await database.pool.connect();try{await c.query('BEGIN');for(const table of ['sw_bonus_owners','sw_contributions','sw_footprints'])await c.query(`DELETE FROM ${table} WHERE world_id=$1`,[realm]);await c.query('DELETE FROM sw_worlds WHERE id=$1',[realm]);await c.query('DELETE FROM sw_sessions s USING sw_testers t WHERE s.tester_id=t.id AND t.realm=$1',[realm]);await c.query('DELETE FROM sw_invites WHERE realm=$1',[realm]);await c.query('DELETE FROM sw_testers WHERE realm=$1',[realm]);await c.query('COMMIT');}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();await database.close();await rm(root,{recursive:true,force:true});}
}
