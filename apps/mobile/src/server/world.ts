import {rememberAccountMode} from './session';
import {parseWorldView,parseEncounterRecap,parseTesterScores} from '@sporeward/protocol';
import {requestHeaders,ConnectionError,SERVER_URL,type Credentials,type HealthRequest} from './client';
async function get(path:string,credentials:Credentials,request:HealthRequest) {
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try {
  const response=await request(SERVER_URL+path,{headers:requestHeaders(credentials),signal:controller.signal,redirect:'error'});
  if(response.status===401){
   let required=false;try{required=(await response.json()).error==='Sign in to a tester account.';}catch{}
   if(required)await rememberAccountMode(true);
   throw new ConnectionError(credentials.playerId?'Sign in to your tester account again. Your saved map remains available.':required?'Open Menu and sign in to your tester account.':'Open Menu to connect and sign in.');
  }
  if(!response.ok)throw new ConnectionError('World update unavailable. Using the last saved map.');
  return await response.json() as unknown;
 }catch(e){if(e instanceof ConnectionError)throw e;throw new ConnectionError('Offline. Using the last saved map.');}finally{clearTimeout(timer);}
}
export async function fetchWorld(credentials:Credentials,request:HealthRequest=fetch) {try{return parseWorldView(await get('/world',credentials,request));}catch(e){if(e instanceof ConnectionError)throw e;throw new ConnectionError('Unexpected world response. Keeping the saved map.');}}
export async function fetchRecap(id:string,credentials:Credentials,request:HealthRequest=fetch) {try{return parseEncounterRecap(await get(`/activities/${encodeURIComponent(id)}/encounters`,credentials,request),id);}catch(e){if(e instanceof ConnectionError)throw e;throw new ConnectionError('Unexpected recap response. Keeping the saved recap.');}}
export async function fetchScores(credentials:Credentials,request:HealthRequest=fetch){
 try{return parseTesterScores(await get('/scores',credentials,request));}catch{throw new ConnectionError('Scores unavailable. Sign in and retry when connected.');}
}
