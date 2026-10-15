import {randomBytes,randomUUID,createHash,scrypt,timingSafeEqual} from 'node:crypto';
import type {Pool} from 'pg';
export type Tester={id:string;username:string;name:string;playerId?:string};
export class AccountError extends Error{}
const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
const derive=(password:string,salt:string)=>new Promise<Buffer>((resolve,reject)=>scrypt(password,Buffer.from(salt,'hex'),64,{N:32768,r:8,p:1,maxmem:64*1024*1024},(e,key)=>e?reject(e):resolve(key)));
const schema=`
CREATE TABLE IF NOT EXISTS sw_testers(id text PRIMARY KEY,realm text NOT NULL,username text NOT NULL,name text NOT NULL,salt text NOT NULL,password_hash text NOT NULL,created_at bigint NOT NULL,UNIQUE(realm,username));
CREATE TABLE IF NOT EXISTS sw_invites(realm text NOT NULL,token_hash text NOT NULL,expires_at bigint NOT NULL,used_by text REFERENCES sw_testers(id),PRIMARY KEY(realm,token_hash));
CREATE TABLE IF NOT EXISTS sw_sessions(token_hash text PRIMARY KEY,tester_id text NOT NULL REFERENCES sw_testers(id),expires_at bigint NOT NULL);
CREATE INDEX IF NOT EXISTS sw_sessions_tester ON sw_sessions(tester_id);
ALTER TABLE sw_testers ADD COLUMN IF NOT EXISTS player_id text;
UPDATE sw_testers SET player_id=id WHERE player_id IS NULL;
ALTER TABLE sw_testers ALTER COLUMN player_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS sw_testers_player ON sw_testers(realm,player_id);
ALTER TABLE sw_invites ADD COLUMN IF NOT EXISTS legacy_owner text;
`;
export class AccountStore{
 private ready:Promise<void>|null=null;
 constructor(private pool:Pool,private realm:string,private now:()=>number=Date.now){if(!/^[A-Za-z0-9-]{1,80}$/.test(realm))throw new Error('Invalid tester account realm.');}
 private initialize(){return this.ready??=this.migrate().catch(e=>{this.ready=null;throw e;});}
 private async migrate(){const c=await this.pool.connect();try{await c.query('BEGIN');await c.query("SELECT pg_advisory_xact_lock(hashtextextended('sporeward-account-schema',0))");await c.query(schema);await c.query('COMMIT');}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
 async invite(lifetimeMs=7*86400000,legacyOwner?:string){
  if(legacyOwner!==undefined&&(!legacyOwner||legacyOwner.length>100||legacyOwner.includes('\0')))throw new AccountError('Invalid legacy owner.');
  if(!Number.isSafeInteger(lifetimeMs)||lifetimeMs<60000||lifetimeMs>30*86400000)throw new AccountError('Invalid invite lifetime.');
  await this.initialize();const token=randomBytes(32).toString('hex'),expiresAt=this.now()+lifetimeMs;
  await this.pool.query('INSERT INTO sw_invites(realm,token_hash,expires_at,legacy_owner) VALUES($1,$2,$3,$4)',[this.realm,digest(token),expiresAt,legacyOwner??null]);return {token,expiresAt};
 }
 async register(invite:string,username:string,name:string,password:string):Promise<Tester>{
  username=username.trim().toLowerCase();name=name.trim();
  if(!/^[a-z0-9][a-z0-9_-]{2,39}$/.test(username)||!name||name.length>80||password.length<12||password.length>256||!/^[a-f0-9]{64}$/.test(invite))throw new AccountError('Use a valid invite, a 3–40 character username, a name and a password of 12–256 characters.');
  await this.initialize();const salt=randomBytes(16).toString('hex'),hash=(await derive(password,salt)).toString('hex'),tester:Tester={id:randomUUID(),username,name},c=await this.pool.connect();
  try{
   await c.query('BEGIN');const allowed=await c.query('SELECT * FROM sw_invites WHERE realm=$1 AND token_hash=$2 FOR UPDATE',[this.realm,digest(invite)]);
   if(!allowed.rows.length||allowed.rows[0].used_by||Number(allowed.rows[0].expires_at)<=this.now())throw new AccountError('Invite is invalid, expired or already used.');
   tester.playerId=allowed.rows[0].legacy_owner??tester.id;
   await c.query('INSERT INTO sw_testers(id,realm,username,name,salt,password_hash,created_at,player_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[tester.id,this.realm,username,name,salt,hash,this.now(),tester.playerId]);
   await c.query('UPDATE sw_invites SET used_by=$3 WHERE realm=$1 AND token_hash=$2',[this.realm,digest(invite),tester.id]);await c.query('COMMIT');return tester;
  }catch(e){await c.query('ROLLBACK');if((e as {code?:string}).code==='23505')throw new AccountError('That username or legacy player is already linked to an account.');throw e;}finally{c.release();}
 }
 async login(username:string,password:string){
  if(typeof username!=='string'||typeof password!=='string'||username.length>40||password.length>256)throw new AccountError('Invalid username or password.');
  await this.initialize();const result=await this.pool.query('SELECT * FROM sw_testers WHERE realm=$1 AND username=$2',[this.realm,username.trim().toLowerCase()]),row=result.rows[0];
  const supplied=await derive(password,row?.salt??'0'.repeat(32)),expected=Buffer.from(row?.password_hash??'0'.repeat(128),'hex');
  if(!timingSafeEqual(supplied,expected)||!row)throw new AccountError('Invalid username or password.');
  const token=randomBytes(32).toString('hex'),expiresAt=this.now()+30*86400000;
  await this.pool.query('INSERT INTO sw_sessions(token_hash,tester_id,expires_at) VALUES($1,$2,$3)',[digest(token),row.id,expiresAt]);return {token,expiresAt,tester:{id:row.id,username:row.username,name:row.name,playerId:row.player_id} as Tester};
 }
 async authenticate(token:string):Promise<Tester|null>{
  if(!/^[a-f0-9]{64}$/.test(token))return null;await this.initialize();
  const result=await this.pool.query('SELECT t.id,t.username,t.name,t.player_id AS "playerId" FROM sw_sessions s JOIN sw_testers t ON t.id=s.tester_id WHERE s.token_hash=$1 AND s.expires_at>$2 AND t.realm=$3',[digest(token),this.now(),this.realm]);return result.rows[0]??null;
 }
 async profiles(ids:string[]):Promise<Tester[]>{
  if(ids.length>1000)throw new AccountError('Too many tester profiles requested.');await this.initialize();
  const result=await this.pool.query('SELECT id,username,name,player_id AS "playerId" FROM sw_testers WHERE realm=$1 AND player_id=ANY($2::text[])',[this.realm,ids]);return result.rows;
 }
 async logout(token:string){await this.initialize();await this.pool.query('DELETE FROM sw_sessions s USING sw_testers t WHERE s.tester_id=t.id AND s.token_hash=$1 AND t.realm=$2',[digest(token),this.realm]);}
}
