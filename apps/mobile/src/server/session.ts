import * as SecureStore from 'expo-secure-store';
import {SERVER_URL,authorization,ConnectionError,type Credentials} from './client';
export type TesterSession={token:string;expiresAt:number;tester:{id:string;username:string;name:string;playerId?:string}};
const KEY='sporeward.session.'+SERVER_URL.replace(/[^A-Za-z0-9._-]/g,'_');
export function parseSession(value:unknown):TesterSession{
 const s=value as TesterSession;
 if(!s||!/^[a-f0-9]{64}$/.test(s.token)||!Number.isSafeInteger(s.expiresAt)||s.expiresAt<=0||!s.tester||typeof s.tester.id!=='string'||!s.tester.id||typeof s.tester.username!=='string'||typeof s.tester.name!=='string')throw new ConnectionError('Unexpected account session.');
 if(s.tester.playerId!==undefined&&(typeof s.tester.playerId!=='string'||!s.tester.playerId||s.tester.playerId.length>100))throw new ConnectionError('Unexpected player identity.');
 return s;
}
export async function savedSession(includeExpired=false){const raw=await SecureStore.getItemAsync(KEY);if(!raw)return null;const session=parseSession(JSON.parse(raw));return includeExpired||session.expiresAt>Date.now()?session:null;}
export async function clearSession(){await SecureStore.deleteItemAsync(KEY);}
async function accountRequest(path:string,c:Credentials,body:unknown,token?:string){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{
  const response=await fetch(SERVER_URL+'/account/'+path,{method:'POST',headers:{Authorization:authorization(c),'Content-Type':'application/json',...(token?{'X-Sporeward-Session':token}:{})},body:JSON.stringify(body),signal:controller.signal,redirect:'error'});
  const result=await response.json();if(!response.ok)throw new ConnectionError(typeof result.error==='string'?result.error:'Account request failed.');return result;
 }catch(e){if(e instanceof ConnectionError)throw e;throw new ConnectionError('Cannot reach the account server. Your recordings remain saved.');}finally{clearTimeout(timer);}
}
export async function signIn(c:Credentials,username:string,password:string){const session=parseSession(await accountRequest('login',c,{username,password}));await SecureStore.setItemAsync(KEY,JSON.stringify(session));return session;}
export async function redeemInvite(c:Credentials,invite:string,username:string,name:string,password:string){await accountRequest('register',c,{invite,username,name,password});return signIn(c,username,password);}
export async function signOut(c:Credentials){const session=await savedSession();if(session)await accountRequest('logout',c,{},session.token);await clearSession();}
