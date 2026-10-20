/** UI fixture; not evidence of GPS eligibility or earned scores. */
import {PostgresWorldPersistence} from '../../apps/server/src/database/world.ts';
import {lifecyclePresentation} from '../../apps/server/src/replay/presentation.ts';
import {readFile,writeFile} from 'node:fs/promises';
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9),preview=await lifecyclePresentation(Date.now());
if(output){await writeFile(output,JSON.stringify(preview.world),{flag:'wx',mode:0o600});console.log('Exported public-map lifecycle examples; no API or database was changed.');process.exit(0);}
if(!process.argv.includes('--reset'))throw new Error('Use --output=NEW_FILE for offline review, or --reset to replace only the disposable native replay world.');
const url=process.env.DATABASE_URL;if(!url)throw new Error('Set DATABASE_URL to the isolated replay database.');
const base='http://127.0.0.1:3102',headers:Record<string,string>={Authorization:'Basic '+Buffer.from((process.env.REPLAY_USERNAME??'emulator')+':'+(process.env.REPLAY_PASSWORD??'emulator-only')).toString('base64')};
const accountPath=process.argv.find(a=>a.startsWith('--account='))?.slice(10);
if(!accountPath)throw new Error('Provide --account=PRIVATE_JSON with a disposable tester username/password.');
const account=JSON.parse(await readFile(accountPath,'utf8'));
if(typeof account.username!=='string'||typeof account.password!=='string')throw new Error('Invalid private account file.');
const login=await fetch(base+'/account/login',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({username:account.username,password:account.password}),signal:AbortSignal.timeout(10000)});
if(!login.ok)throw new Error('Could not sign into the local tester account (HTTP '+login.status+').');
const session=await login.json();if(typeof session.token!=='string'||!/^[a-f0-9]{64}$/.test(session.token))throw new Error('Invalid local account response.');
headers['X-Sporeward-Session']=session.token;
try{
 const environment=await fetch(base+'/replay/environment',{headers,signal:AbortSignal.timeout(8000)});
 if(!environment.ok)throw new Error('Cannot authenticate the local replay API.');
 const info=await environment.json();
 if(info.mode!=='native-replay'||info.storage!=='postgis'||info.seed!==73||!info.resettable)throw new Error('Expected the dedicated PostGIS native replay environment.');
 const reset=await fetch(base+'/replay/reset',{method:'POST',headers,signal:AbortSignal.timeout(15000)});if(!reset.ok)throw new Error('Replay world reset failed.');
 const persistence=new PostgresWorldPersistence(url,'native-living');
 try{
  await persistence.transaction(()=>{throw new Error('Reset must create the replay world first.');},async s=>{
   if(s.contributions.length||Object.keys(s.activities).length)throw new Error('Another replay is active; stop it before preparing the map.');
   const generation=s.resetGeneration;Object.assign(s,preview.state);s.resetGeneration=generation;
  });
  console.log('Prepared lifecycle presentation in native-living. Restore with POST /replay/reset or a normal replay without --keep-world.');
 }finally{await persistence.close();}
}finally{await fetch(base+'/account/logout',{method:'POST',headers,signal:AbortSignal.timeout(8000)}).catch(()=>{});}
