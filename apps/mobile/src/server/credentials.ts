import {savedSession} from './session';
import * as SecureStore from 'expo-secure-store';
import { authorization, type Credentials } from './client';
const KEY='sporeward.test-server.credentials';
export async function loadCredentials():Promise<Credentials|null> {
 const raw=await SecureStore.getItemAsync(KEY);
 if(!raw) return null;
 const c:unknown=JSON.parse(raw);
 if(typeof c!=='object'||!c||!('username' in c)||typeof c.username!=='string'||!('password' in c)||typeof c.password!=='string') throw new Error('Invalid saved settings.');
 const credentials={username:c.username,password:c.password};authorization(credentials);const session=await savedSession(true);return {...credentials,...(session?{...(session.expiresAt>Date.now()?{session:session.token}:{}),playerId:session.tester.id}:{})};
}
export async function saveCredentials(c:Credentials) {authorization(c);await SecureStore.setItemAsync(KEY,JSON.stringify({username:c.username,password:c.password}));}
export async function forgetCredentials() {await SecureStore.deleteItemAsync(KEY);}
