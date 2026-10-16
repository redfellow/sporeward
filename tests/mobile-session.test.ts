import {beforeEach,describe,it,expect,vi} from 'vitest';
const memory=vi.hoisted(()=>new Map<string,string>());
vi.mock('expo-secure-store',()=>({getItemAsync:async(k:string)=>memory.get(k)??null,setItemAsync:async(k:string,v:string)=>{memory.set(k,v);},deleteItemAsync:async(k:string)=>{memory.delete(k);}}));
import {recordingIdentity,rememberAccountMode,savedSession,signIn,signOut} from '../apps/mobile/src/server/session';
const c={username:'gateway',password:'disposable'},session=(expiry=Date.now()+86400000)=>({token:'a'.repeat(64),expiresAt:expiry,tester:{id:'rider-a',username:'rider',name:'Rider'}});
beforeEach(()=>{memory.clear();vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify(session()))));});
describe('recording account identity',()=>{
 it('retains legacy recording only for a legacy/unknown environment',async()=>{expect(await recordingIdentity()).toBe('legacy-local');await rememberAccountMode(true);await expect(recordingIdentity()).rejects.toThrow('Sign in');});
 it('preserves account ownership when the saved session expires offline',async()=>{vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(session(Date.now()-1))));await signIn(c,'rider','private-test-password');expect(await savedSession()).toBeNull();expect(await recordingIdentity()).toBe('rider-a');});
 it('requires login after sign-out instead of silently creating unowned outings',async()=>{await signIn(c,'rider','private-test-password');expect(await recordingIdentity()).toBe('rider-a');vi.mocked(fetch).mockResolvedValue(new Response('{"status":"signed-out"}'));await signOut(c);await expect(recordingIdentity()).rejects.toThrow('Sign in');expect(await savedSession(true)).toBeNull();});
});
