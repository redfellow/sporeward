import {mkdir,readFile,writeFile,lstat,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {createApp} from '../app.ts';
import {ActivityStore} from '../activity-store.ts';
import {WorldStore} from '../world-store.ts';
import {tampereWorldFixtures} from '../spatial/tampere.ts';
import {PostgresWorldPersistence} from '../database/world.ts';
const root=fileURLToPath(new URL('../../../../work/replay/native-server/',import.meta.url));
await mkdir(root,{recursive:true,mode:0o700});if((await lstat(root)).isSymbolicLink())throw new Error('Native replay root must not be a symlink.');
const marker=join(root,'simulation.json');
try{if(JSON.parse(await readFile(marker,'utf8')).kind!=='sporeward-native-replay')throw new Error('Unrecognized replay directory.');}
catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;if((await readdir(root)).length)throw new Error('Refusing to claim an existing unmarked directory.');await writeFile(marker,JSON.stringify({kind:'sporeward-native-replay'}),{mode:0o600});}
const port=Number(process.env.REPLAY_PORT??3102);if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid replay port.');
// These defaults are disposable local test credentials, never real field credentials.
const auth={username:process.env.REPLAY_USERNAME??'emulator',password:process.env.REPLAY_PASSWORD??'emulator-only'};
const {fixtures,access}=await tampereWorldFixtures(73,20);
const persistence=process.env.DATABASE_URL?new PostgresWorldPersistence(process.env.DATABASE_URL,'native-living'):undefined;
const world=new WorldStore(join(root,'world-living'),Date.now,()=>fixtures,{seed:73,allowSimulationReset:true,persistence,spatial:access.cells});
const app=await createApp({auth,activityStore:new ActivityStore(join(root,'activities'),auth.username),worldStore:world});
app.get('/replay/environment',async()=>({mode:'native-replay',clock:'wall',lifecycle:'geographic',seed:73,resettable:true,storage:persistence?'postgis':'files'}));
app.post('/replay/reset',async()=>{if(JSON.parse(await readFile(marker,'utf8')).kind!=='sporeward-native-replay')throw new Error('Replay marker changed.');return world.resetForSimulation();});
await app.listen({host:'127.0.0.1',port});console.log(`Native replay API: http://127.0.0.1:${port} (isolated data; wall clock).`);
for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,async()=>{await app.close();await persistence?.close();process.exit();});
