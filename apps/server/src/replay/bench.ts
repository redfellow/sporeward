import {randomUUID} from 'node:crypto';
import {AccountStore} from '../accounts/store.ts';
import {mkdir,readFile,writeFile,lstat,readdir,rename,rm} from 'node:fs/promises';
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
const clockPath=join(root,'clock.json');let offsetMinutes=0;
try{const saved=JSON.parse(await readFile(clockPath,'utf8'));if(saved.kind!=='native-replay-clock'||!Number.isSafeInteger(saved.offsetMinutes)||saved.offsetMinutes<0||saved.offsetMinutes>10080)throw new Error('Invalid isolated replay clock.');offsetMinutes=saved.offsetMinutes;}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
const clockNow=()=>Date.now()+offsetMinutes*60000;
let controls=Promise.resolve<unknown>(undefined);
function changeClock<T>(minutes:number,operation:()=>Promise<T>){
 const next=controls.then(async()=>{
  if(minutes!==0&&minutes<offsetMinutes)throw Object.assign(new Error('Replay clock cannot move backwards; reset first.'),{statusCode:400});
  const temporary=clockPath+'.'+randomUUID();
  try{await writeFile(temporary,JSON.stringify({kind:'native-replay-clock',offsetMinutes:minutes}),{mode:0o600,flag:'wx'});await rename(temporary,clockPath);}finally{await rm(temporary,{force:true});}
  offsetMinutes=minutes;return operation();
 });controls=next.catch(()=>{});return next;
}
const port=Number(process.env.REPLAY_PORT??3102);if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid replay port.');
// These defaults are disposable local test credentials, never real field credentials.
const auth={username:process.env.REPLAY_USERNAME??'emulator',password:process.env.REPLAY_PASSWORD??'emulator-only'};
const {fixtures,access}=await tampereWorldFixtures(73,20,'baseline',5);
const persistence=process.env.DATABASE_URL?new PostgresWorldPersistence(process.env.DATABASE_URL,'native-living'):undefined;
const world=new WorldStore(join(root,'world-living'),clockNow,()=>fixtures,{seed:73,allowSimulationReset:true,persistence,spatial:access.cells});
const accounts=persistence?new AccountStore(persistence.pool,'native-living'):undefined;
const app=await createApp({auth,accounts,...(accounts?{activityStoreFor:(player:string)=>new ActivityStore(join(root,'activities'),player)}:{activityStore:new ActivityStore(join(root,'activities'),auth.username)}),worldStore:world});
app.get('/replay/environment',async()=>({mode:'native-replay',clock:offsetMinutes?'accelerated':'wall',offsetMinutes,lifecycle:'geographic',accounts:!!accounts,seed:73,resettable:true,storage:persistence?'postgis':'files'}));
app.post('/replay/reset',async()=>{if(JSON.parse(await readFile(marker,'utf8')).kind!=='sporeward-native-replay')throw new Error('Replay marker changed.');return changeClock(0,()=>world.resetForSimulation());});
// Absolute offsets make a retried control request idempotent. Normal native
// replay must reset first; it never records GPS against the accelerated clock.
app.post('/replay/advance',async(req,reply)=>{
 const minutes=(req.body as {offsetMinutes?:unknown}|null)?.offsetMinutes;
 if(typeof minutes!=='number'||!Number.isSafeInteger(minutes)||minutes<offsetMinutes||minutes<1||minutes>10080)return reply.code(400).send({error:'Use a forward absolute offsetMinutes between 1 and 10080; reset before normal GPS replay.'});
 return changeClock(minutes,async()=>{await world.tick();return {clock:'accelerated',offsetMinutes:minutes};});
});
await world.prepareOrganicContours();await world.prepareShorelines();await app.listen({host:'127.0.0.1',port});console.log(`Native replay API: http://127.0.0.1:${port} (isolated data; ${offsetMinutes?'accelerated clock +'+offsetMinutes+' min':'wall clock'}).`);
for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,async()=>{await app.close();await persistence?.close();process.exit();});
