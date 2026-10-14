import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {PostgresWorldPersistence} from '../../apps/server/src/database/world.ts';
import {tampereWorldFixtures} from '../../apps/server/src/spatial/tampere.ts';
import {WorldStore} from '../../apps/server/src/world-store.ts';
import {parseReplayTrack,rebaseReplay} from '../../packages/protocol/src/replay.ts';
const url=process.env.DATABASE_URL;if(!url)throw new Error('Set DATABASE_URL to the isolated replay database.');
const worldId='db-check-'+randomUUID();let now=1800000000000;
const {fixtures,access}=await tampereWorldFixtures();
let persistence=new PostgresWorldPersistence(url,worldId,()=>now);
try{
 let world=new WorldStore('',()=>now,()=>fixtures,{persistence,allowSimulationReset:true,spatial:access.cells});
 await world.view('db-check-player');
 const track=parseReplayTrack(JSON.parse(await readFile(process.argv[2]??'work/replay/field-phone.json','utf8')));
 const activity=rebaseReplay(track,now+60000,'db-check-outing');now=activity.activity.ended;
 // This check concerns persistence; activity validation is exercised by the replay runner.
 const receipt={activityId:activity.activity.id,totalFixes:activity.fixes.length,receivedAt:now,distanceMetres:2000,eligibleForGame:true};
 const recap=await world.process('db-check-player',activity.activity,activity.fixes,receipt as any);
 assert.ok(recap.confirmedVisitPoints>0,'Private outing should touch the reference world.');
 const before=await world.view('db-check-player');await persistence.close();
 persistence=new PostgresWorldPersistence(url,worldId,()=>now);world=new WorldStore('',()=>now,()=>fixtures,{persistence,allowSimulationReset:true,spatial:access.cells});
 assert.deepEqual(await world.view('db-check-player'),before);
 assert.deepEqual(await world.activity('db-check-player',activity.activity.id),recap);
 try{await persistence.transaction(()=>{throw new Error('Unexpected missing world.');},async state=>{state.engine.targets[0].strength=999;throw new Error('deliberate rollback');});}catch(e){assert.equal((e as Error).message,'deliberate rollback');}
 assert.deepEqual(await world.view('db-check-player'),before);
 const counts=await persistence.pool.query('SELECT (SELECT count(*)::int FROM sw_footprints WHERE world_id=$1) AS footprints,(SELECT count(*)::int FROM sw_contributions WHERE world_id=$1) AS contributions',( [worldId]));
 const geometry=await persistence.pool.query('SELECT bool_and(ST_IsValid(shape)) AS valid FROM sw_footprints WHERE world_id=$1',[worldId]);
 assert.ok(counts.rows[0].footprints>20,'Growth must persist earlier and current footprints.');assert.ok(counts.rows[0].contributions>0);assert.equal(geometry.rows[0].valid,true);
 now+=13*3600000;const later=await world.view('db-check-player');assert.ok(later.outbreaks.some((o,i)=>o.strength<before.outbreaks[i].strength));
 await world.resetForSimulation();
 const reset=await persistence.pool.query('SELECT count(*)::int AS count FROM sw_contributions WHERE world_id=$1',[worldId]);assert.equal(reset.rows[0].count,0);assert.equal((await world.view('db-check-player')).outbreaks.length,20);
 console.log(JSON.stringify({restartPreserved:true,rollbackPreserved:true,resetClearedOnlyTestWorld:true,validGeometry:true,...counts.rows[0],confirmedVisitPoints:recap.confirmedVisitPoints}));
}finally{
 // Only this explicitly disposable random world is removed; no reset of shared data.
 const client=await persistence.pool.connect();try{await client.query('BEGIN');for(const table of ['sw_bonus_owners','sw_contributions','sw_footprints'])await client.query(`DELETE FROM ${table} WHERE world_id=$1`,[worldId]);await client.query('DELETE FROM sw_worlds WHERE id=$1',[worldId]);await client.query('COMMIT');}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();await persistence.close();}
}
