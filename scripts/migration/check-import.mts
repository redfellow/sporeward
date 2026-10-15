import {randomUUID} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import assert from 'node:assert/strict';
import {createWorld} from '../../packages/game/src/index.ts';
import {tampereTestOutbreaks} from '../../apps/server/src/test-outbreaks.ts';
import {parseWorldSnapshot} from '../../apps/server/src/database/import.ts';
import {PostgresWorldPersistence} from '../../apps/server/src/database/world.ts';
const url=process.env.DATABASE_URL;if(!url)throw new Error('Set isolated replay DATABASE_URL.');
const fixtures=tampereTestOutbreaks(),state=parseWorldSnapshot({version:1,startedAt:1800000000000,fixtures,engine:createWorld({ids:fixtures.map(f=>f.id)}),contributions:[],bonuses:{},activities:{}}),ids=['import-check-'+randomUUID(),'occupied-check-'+randomUUID()],stores=ids.map(id=>new PostgresWorldPersistence(url,id));
try{
 assert.equal((await stores[0].importSnapshot(state,'a'.repeat(64))).alreadyImported,false);
 assert.equal((await stores[0].importSnapshot(state,'a'.repeat(64))).alreadyImported,true);
 await assert.rejects(stores[0].importSnapshot(state,'b'.repeat(64)),/different snapshot/);
 await stores[1].transaction(()=>structuredClone(state),async()=>null);
 await assert.rejects(stores[1].importSnapshot(state,'a'.repeat(64)),/overwrite/);
 const saved=await stores[1].pool.query('SELECT snapshot FROM sw_worlds WHERE id=$1',[ids[1]]);assert.ok(isDeepStrictEqual(saved.rows[0].snapshot,state),'Refused import must leave destination intact.');
 const bad=structuredClone(state);bad.engine.scores.invalid=-1;assert.throws(()=>parseWorldSnapshot(bad));
 console.log(JSON.stringify({idempotent:true,changedSourceRejected:true,populatedDestinationPreserved:true,corruptRewardsRejected:true}));
}finally{
 for(const [i,db] of stores.entries()){const c=await db.pool.connect();try{await c.query('BEGIN');for(const table of ['sw_world_imports','sw_bonus_owners','sw_contributions','sw_footprints'])await c.query(`DELETE FROM ${table} WHERE world_id=$1`,[ids[i]]);await c.query('DELETE FROM sw_worlds WHERE id=$1',[ids[i]]);await c.query('COMMIT');}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();await db.close();}}
}
