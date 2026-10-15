import {Pool} from 'pg';
import {mkdir,writeFile,chmod,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomUUID,randomBytes} from 'node:crypto';
import {databaseConnection} from '../../apps/server/src/database/config.ts';
import {AccountStore} from '../../apps/server/src/accounts/store.ts';
const option=(name:string)=>process.argv.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3);
const url=databaseConnection();if(!url)throw new Error('Configure the intended private account database.');
const realm=option('realm')??process.env.ACCOUNT_REALM??'native-living',username=option('username')??'owner',name=option('name')??'Owner';
let legacyOwner=option('legacy-owner');
if(option('snapshot')){const source=JSON.parse(await readFile(option('snapshot')!,'utf8')),owners=[...new Set<string>(source.contributions.map((c:{player:string})=>c.player))];if(!legacyOwner){if(owners.length!==1)throw new Error('Choose --legacy-owner explicitly for this snapshot.');legacyOwner=owners[0];}if(!owners.includes(legacyOwner))throw new Error('Chosen owner does not occur in this snapshot.');}
const directory=resolve(process.env.ACCOUNT_PRIVATE_DIR??'work/replay/accounts');await mkdir(directory,{recursive:true,mode:0o700});await chmod(directory,0o700);
const password=randomBytes(24).toString('hex'),path=resolve(directory,randomUUID()+'.json');
// Save the generated password before creating the account; a later filesystem
// failure must never leave an account with an unrecoverable generated password.
await writeFile(path,JSON.stringify({realm,username,name,password,legacyOwner:legacyOwner??null,status:'pending'},null,2),{mode:0o600,flag:'wx'});
const pool=new Pool({connectionString:url,max:1,connectionTimeoutMillis:8000});
try{
 const store=new AccountStore(pool,realm),invite=await store.invite(undefined,legacyOwner),tester=await store.register(invite.token,username,name,password);
 await writeFile(path,JSON.stringify({realm,username,name,password,tester,status:'ready'},null,2),{mode:0o600});
 console.log('Account details saved privately: '+path);
}finally{await pool.end();}
