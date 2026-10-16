import { fromByteArray } from 'base64-js';
const localTestUrl=process.env.EXPO_PUBLIC_TEST_SERVER_URL;
const development=typeof __DEV__!=='undefined'&&__DEV__;
if(development&&localTestUrl&&!/^http:\/\/127\.0\.0\.1:[0-9]{2,5}$/.test(localTestUrl))throw new Error('Development test API must use Android-reversed loopback.');
export const SERVER_URL=development&&localTestUrl?localTestUrl:'https://sporeward.redlan.co';
export type Credentials={username:string;password:string;session?:string;playerId?:string};
export class ConnectionError extends Error {}
export function authorization(c:Credentials) {
 if(!c.username || c.username.includes(':') || !c.password) throw new ConnectionError('Enter a username and password. The username cannot contain a colon.');
 const bytes=encodeURIComponent(`${c.username}:${c.password}`).replace(/%([0-9A-F]{2})/g,(_,hex:string)=>String.fromCharCode(parseInt(hex,16)));
 const header='Basic '+fromByteArray(Uint8Array.from(bytes,c=>c.charCodeAt(0)));
 if(header.length>1024) throw new ConnectionError('These credentials are too long.');
 return header;
}
export function requestHeaders(c:Credentials):Record<string,string>{return {Authorization:authorization(c),...(c.session?{'X-Sporeward-Session':c.session}:{})};}
export type HealthRequest=(url:string,options:RequestInit)=>Promise<Response>;
export async function checkConnection(c:Credentials,request:HealthRequest=fetch,timeoutMs=8000) {
 const header=authorization(c),controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try {
  const response=await request(`${SERVER_URL}/health`,{headers:{Authorization:header},signal:controller.signal,redirect:'error'});
  if(response.status===401) throw new ConnectionError('Authentication failed. Check your tester credentials.');
  if(response.status===429) throw new ConnectionError('Too many connection checks. Try again shortly.');
  if(!response.ok) throw new ConnectionError('The test server is temporarily unavailable.');
  let body:unknown;
  try {body=await response.json();} catch {throw new ConnectionError('The server returned an unexpected response.');}
  if(typeof body!=='object'||body===null||!('service' in body)||body.service!=='sporeward'||!('status' in body)||body.status!=='ok') throw new ConnectionError('The server returned an unexpected response.');
  if('accounts' in body&&typeof body.accounts!=='boolean')throw new ConnectionError('The server returned an unexpected response.');
  return {accounts:'accounts' in body&&body.accounts===true};
 } catch(e) {
  if(e instanceof ConnectionError) throw e;
  throw new ConnectionError(controller.signal.aborted?'Connection timed out. Recording can continue offline.':'Cannot reach the test server. Recording can continue offline.');
 } finally {clearTimeout(timer);}
}
