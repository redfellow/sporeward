import {Pool} from 'pg';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {AccountStore} from '../../apps/server/src/accounts/store.ts';
const url=process.env.DATABASE_URL;if(!url)throw new Error('Set DATABASE_URL to the isolated replay database.');
const pool=new Pool({connectionString:url,max:2}),realm='account-check-'+randomUUID();let now=1800000000000;
const accounts=new AccountStore(pool,realm,()=>now);
try{
 const invite=await accounts.invite(),tester=await accounts.register(invite.token,'tester-one','Tester One','only-for-this-account-check');
 await assert.rejects(accounts.register(invite.token,'tester-two','Tester Two','only-for-this-account-check'));
 await assert.rejects(accounts.login('tester-one','wrong-password'));
 const login=await accounts.login('tester-one','only-for-this-account-check');assert.equal(login.tester.id,tester.id);
 assert.deepEqual(await new AccountStore(pool,realm,()=>now).authenticate(login.token),tester);
 assert.equal(await new AccountStore(pool,realm+'-other',()=>now).authenticate(login.token),null);
 const saved=await pool.query('SELECT token_hash FROM sw_sessions WHERE tester_id=$1',[tester.id]);assert.notEqual(saved.rows[0].token_hash,login.token);
 await accounts.logout(login.token);assert.equal(await accounts.authenticate(login.token),null);
 const again=await accounts.login('tester-one','only-for-this-account-check');now+=30*86400000;assert.equal(await accounts.authenticate(again.token),null);
 console.log(JSON.stringify({singleUseInvite:true,passwordRejection:true,restartSession:true,realmIsolation:true,hashedSession:true,logout:true,expiry:true}));
}finally{
 const c=await pool.connect();try{await c.query('BEGIN');await c.query('DELETE FROM sw_sessions s USING sw_testers t WHERE s.tester_id=t.id AND t.realm=$1',[realm]);await c.query('DELETE FROM sw_invites WHERE realm=$1',[realm]);await c.query('DELETE FROM sw_testers WHERE realm=$1',[realm]);await c.query('COMMIT');}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();await pool.end();}
}
