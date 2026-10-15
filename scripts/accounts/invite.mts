import {databaseConnection} from '../../apps/server/src/database/config.ts';
import {Pool} from 'pg';
import {mkdir,writeFile,chmod} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {AccountStore} from '../../apps/server/src/accounts/store.ts';
const url=databaseConnection();if(!url)throw new Error('Set DATABASE_URL for the intended account database.');
const realm=process.argv.find(a=>a.startsWith('--realm='))?.slice(8)??process.env.ACCOUNT_REALM??'native-living';
const legacyOwner=process.argv.find(a=>a.startsWith('--legacy-owner='))?.slice(15);
const directory=resolve(process.env.ACCOUNT_PRIVATE_DIR??'work/replay/invites');await mkdir(directory,{recursive:true,mode:0o700});await chmod(directory,0o700);
const pool=new Pool({connectionString:url,max:1,connectionTimeoutMillis:8000});
try{
 const invite=await new AccountStore(pool,realm).invite(undefined,legacyOwner),path=resolve(directory,randomUUID()+'.json');
 await writeFile(path,JSON.stringify({realm,legacyOwner:legacyOwner??null,...invite},null,2),{mode:0o600,flag:'wx'});
 console.log('Invite saved privately: '+path+' (expires '+new Date(invite.expiresAt).toISOString()+')');
}finally{await pool.end();}
