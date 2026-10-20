/** Controls only the authenticated loopback native replay bench. */
import {readFile} from 'node:fs/promises';
const options=process.argv.slice(2),accountPath=options.find(a=>a.startsWith('--account='))?.slice(10),offset=options.find(a=>a.startsWith('--offset-minutes='))?.slice(17);
const reset=options.includes('--reset'),status=options.includes('--status');
if(Number(reset)+Number(status)+Number(offset!==undefined)!==1||!accountPath)throw new Error('Use --account=PRIVATE_JSON and exactly one of --status, --reset or --offset-minutes=MINUTES.');
const minutes=offset===undefined?undefined:Number(offset);if(minutes!==undefined&&(!Number.isSafeInteger(minutes)||minutes<1||minutes>10080))throw new Error('Offset must be 1–10080 whole minutes.');
const account=JSON.parse(await readFile(accountPath,'utf8'));if(typeof account.username!=='string'||typeof account.password!=='string')throw new Error('Invalid private tester account.');
const headers:Record<string,string>={Authorization:'Basic '+Buffer.from((process.env.REPLAY_USERNAME??'emulator')+':'+(process.env.REPLAY_PASSWORD??'emulator-only')).toString('base64'),'Content-Type':'application/json'};
async function call(path:string,body?:unknown){
 const r=await fetch('http://127.0.0.1:3102'+path,{headers,method:body===undefined?'GET':'POST',body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw new Error('Local replay control HTTP '+r.status);return r.json();
}
const session=await call('/account/login',{username:account.username,password:account.password});
if(typeof session.token!=='string')throw new Error('Invalid tester session.');headers['X-Sporeward-Session']=session.token;
try{
 const environment=await call('/replay/environment');if(environment.mode!=='native-replay'||!environment.resettable)throw new Error('Not the isolated native replay environment.');
 if(reset)await call('/replay/reset',{});else if(minutes!==undefined)await call('/replay/advance',{offsetMinutes:minutes});
 const result=await call('/replay/environment');console.log(JSON.stringify({mode:result.mode,clock:result.clock,offsetMinutes:result.offsetMinutes,reset},null,2));
}finally{await call('/account/logout',{}).catch(()=>{});}
