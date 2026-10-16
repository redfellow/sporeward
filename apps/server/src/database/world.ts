import {Pool,type PoolClient} from 'pg';
import {createHash} from 'node:crypto';
import type {Persisted} from '../world-store.ts';
export interface WorldPersistence {transaction<T>(initial:()=>Persisted,operation:(state:Persisted)=>Promise<T>):Promise<T>}
const schema=`
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TABLE IF NOT EXISTS sw_worlds(id text PRIMARY KEY, snapshot jsonb NOT NULL, updated_at bigint NOT NULL);
CREATE TABLE IF NOT EXISTS sw_footprints(
 world_id text NOT NULL REFERENCES sw_worlds(id), outbreak_id text NOT NULL,
 valid_from bigint NOT NULL, valid_until bigint,
 shape geometry(Polygon,4326) NOT NULL, fingerprint text NOT NULL,
 PRIMARY KEY(world_id,outbreak_id,valid_from), CHECK(valid_until IS NULL OR valid_until>=valid_from));
CREATE TABLE IF NOT EXISTS sw_world_imports(world_id text PRIMARY KEY REFERENCES sw_worlds(id),source_hash text NOT NULL,imported_at bigint NOT NULL);
CREATE INDEX IF NOT EXISTS sw_footprints_shape ON sw_footprints USING gist(shape);
CREATE INDEX IF NOT EXISTS sw_footprints_time ON sw_footprints(world_id,valid_from,valid_until);
CREATE TABLE IF NOT EXISTS sw_contributions(
 world_id text NOT NULL REFERENCES sw_worlds(id), id text NOT NULL, player_id text NOT NULL,
 activity_id text NOT NULL, outbreak_id text NOT NULL, contact_at bigint NOT NULL, visit_points integer NOT NULL,
 PRIMARY KEY(world_id,id));
CREATE INDEX IF NOT EXISTS sw_contributions_player ON sw_contributions(world_id,player_id,outbreak_id,contact_at);
CREATE TABLE IF NOT EXISTS sw_bonus_owners(
 world_id text NOT NULL REFERENCES sw_worlds(id), award_key text NOT NULL, contribution_id text NOT NULL,
 PRIMARY KEY(world_id,award_key), FOREIGN KEY(world_id,contribution_id) REFERENCES sw_contributions(world_id,id));
`;
/** One checked-out client owns the lock, engine update, geometry and rewards. */
export class PostgresWorldPersistence implements WorldPersistence {
 readonly pool:Pool;private ready:Promise<void>|null=null;
 constructor(url:string,private worldId:string,private now:()=>number=Date.now){
  if(!/^[A-Za-z0-9-]{1,100}$/.test(worldId))throw new Error('Invalid persistent world ID.');
  this.pool=new Pool({connectionString:url,max:4,connectionTimeoutMillis:8000});
 }
 private initialize(){return this.ready??=this.migrate().catch(e=>{this.ready=null;throw e;});}
 private async migrate(){
  const client=await this.pool.connect();
  try{await client.query('BEGIN');await client.query("SELECT pg_advisory_xact_lock(hashtextextended('sporeward-schema',0))");await client.query(schema);await client.query('COMMIT');}
  catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 }
 async transaction<T>(initial:()=>Persisted,operation:(state:Persisted)=>Promise<T>):Promise<T>{
  await this.initialize();const client=await this.pool.connect();
  try{
   await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['sporeward:'+this.worldId]);
   const saved=await client.query('SELECT snapshot FROM sw_worlds WHERE id=$1 FOR UPDATE',[this.worldId]);
   const state:Persisted=saved.rows[0]?.snapshot??initial();if(state.version!==1)throw new Error('Unsupported persistent world version.');
   const result=await operation(state);await this.save(client,state);await client.query('COMMIT');return result;
  }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 }
 private async save(client:PoolClient,state:Persisted){
  const existing=await client.query('SELECT snapshot FROM sw_worlds WHERE id=$1',[this.worldId]);
  const resetting=existing.rows.length&&(existing.rows[0].snapshot.resetGeneration??0)!==(state.resetGeneration??0);
  if(resetting){
   for(const table of ['sw_bonus_owners','sw_contributions','sw_footprints'])await client.query(`DELETE FROM ${table} WHERE world_id=$1`,[this.worldId]);
  }
  await client.query('INSERT INTO sw_worlds(id,snapshot,updated_at) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET snapshot=EXCLUDED.snapshot,updated_at=EXCLUDED.updated_at',[this.worldId,state,this.now()]);
  if(state.footprints){
   const previous=new Map<string,NonNullable<Persisted['footprints']>[number]>((resetting?[]:existing.rows[0]?.snapshot.footprints??[]).map((f:NonNullable<Persisted['footprints']>[number])=>[f.id+':'+f.validFrom,f]));
   const changed=state.footprints.filter(f=>{const old=previous.get(f.id+':'+f.validFrom);return !old||old.validUntil!==f.validUntil||JSON.stringify(old.ring)!==JSON.stringify(f.ring);}).map(f=>{
    const ring=[...f.ring,f.ring[0]];return {id:f.id,from:f.validFrom,until:f.validUntil,shape:{type:'Polygon',coordinates:[ring]},fingerprint:createHash('sha256').update(JSON.stringify(ring)).digest('hex')};
   });
   if(changed.length)await client.query(`INSERT INTO sw_footprints(world_id,outbreak_id,valid_from,valid_until,shape,fingerprint)
    SELECT $1,p.id,p."from",p.until,ST_SetSRID(ST_GeomFromGeoJSON(p.shape::text),4326),p.fingerprint
    FROM jsonb_to_recordset($2::jsonb) AS p(id text,"from" bigint,until bigint,shape jsonb,fingerprint text)
    ON CONFLICT(world_id,outbreak_id,valid_from) DO UPDATE SET valid_until=EXCLUDED.valid_until,shape=EXCLUDED.shape,fingerprint=EXCLUDED.fingerprint`,[this.worldId,JSON.stringify(changed)]);
  }
  for(const fixture of state.footprints?[]:state.fixtures){
   const ring=[...fixture.ring,fixture.ring[0]],fingerprint=createHash('sha256').update(JSON.stringify(ring)).digest('hex');
   const current=await client.query('SELECT fingerprint,valid_from FROM sw_footprints WHERE world_id=$1 AND outbreak_id=$2 AND valid_until IS NULL ORDER BY valid_from DESC LIMIT 1',[this.worldId,fixture.id]);
   const target=state.engine.targets.find(o=>o.id===fixture.id);if(!target)continue;
   const until=target.cleared===null?null:state.startedAt+target.cleared*60000+state.engine.balance.cleanupProtectionMs;
   if(current.rows[0]?.fingerprint===fingerprint){if(until!==null)await client.query('UPDATE sw_footprints SET valid_until=$3 WHERE world_id=$1 AND outbreak_id=$2 AND valid_until IS NULL',[this.worldId,fixture.id,until]);continue;}
   const from=current.rows.length?state.startedAt+state.engine.time*60000:state.startedAt;
   if(current.rows.length&&Number(current.rows[0].valid_from)===from){
    await client.query('UPDATE sw_footprints SET shape=ST_SetSRID(ST_GeomFromGeoJSON($4),4326),fingerprint=$5,valid_until=$6 WHERE world_id=$1 AND outbreak_id=$2 AND valid_from=$3',[this.worldId,fixture.id,from,JSON.stringify({type:'Polygon',coordinates:[ring]}),fingerprint,until]);continue;
   }
   if(current.rows.length)await client.query('UPDATE sw_footprints SET valid_until=$3 WHERE world_id=$1 AND outbreak_id=$2 AND valid_until IS NULL',[this.worldId,fixture.id,from]);
   await client.query('INSERT INTO sw_footprints(world_id,outbreak_id,valid_from,valid_until,shape,fingerprint) VALUES($1,$2,$3,$4,ST_SetSRID(ST_GeomFromGeoJSON($5),4326),$6) ON CONFLICT DO NOTHING',[this.worldId,fixture.id,from,until,JSON.stringify({type:'Polygon',coordinates:[ring]}),fingerprint]);
  }
  for(const c of state.contributions)await client.query('INSERT INTO sw_contributions(world_id,id,player_id,activity_id,outbreak_id,contact_at,visit_points) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(world_id,id) DO UPDATE SET contact_at=EXCLUDED.contact_at',[this.worldId,c.id,c.player,c.activityId,c.outbreakId,c.contactAt,c.visitPoints]);
  for(const [key,id] of Object.entries(state.bonuses))await client.query('INSERT INTO sw_bonus_owners(world_id,award_key,contribution_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[this.worldId,key,id]);
 }
 async importSnapshot(state:Persisted,sourceHash:string){
  if(!/^[a-f0-9]{64}$/.test(sourceHash))throw new Error('Invalid snapshot digest.');await this.initialize();const client=await this.pool.connect();
  try{
   await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['sporeward:'+this.worldId]);
   const imported=await client.query('SELECT source_hash FROM sw_world_imports WHERE world_id=$1',[this.worldId]);
   if(imported.rows.length){if(imported.rows[0].source_hash!==sourceHash)throw new Error('Destination was imported from a different snapshot.');await client.query('COMMIT');return {alreadyImported:true};}
   if((await client.query('SELECT 1 FROM sw_worlds WHERE id=$1',[this.worldId])).rows.length)throw new Error('Refusing to overwrite an existing world.');
   await this.save(client,state);const valid=await client.query('SELECT bool_and(ST_IsValid(shape)) AS valid FROM sw_footprints WHERE world_id=$1',[this.worldId]);if(valid.rows[0].valid===false)throw new Error('Invalid snapshot geometry.');
   await client.query('INSERT INTO sw_world_imports(world_id,source_hash,imported_at) VALUES($1,$2,$3)',[this.worldId,sourceHash,this.now()]);await client.query('COMMIT');return {alreadyImported:false};
  }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 }
 async close(){await this.pool.end();}
}
