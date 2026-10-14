import {useCallback,useEffect,useRef,useState} from 'react';
import {AppState} from 'react-native';
import {parseWorldView,parseEncounterRecap,type WorldView,type EncounterRecap} from '@sporeward/protocol';
import {loadCredentials} from './credentials';
import {fetchWorld,fetchRecap} from './world';
import * as store from '../recording/store';
export function useWorld(activityId:string|null) {
 const [world,setWorld]=useState<WorldView|null>(null),[recap,setRecap]=useState<EncounterRecap|null>(null),[status,setStatus]=useState('Configure tester credentials to load outbreaks.');
 const busy=useRef(false),generation=useRef(0),mounted=useRef(true),owner=useRef<string|null>(null);
 const refresh=useCallback(async()=>{
  if(busy.current)return;busy.current=true;const token=generation.current;
  const valid=()=>mounted.current&&generation.current===token;
  try {
   const credentials=await loadCredentials();if(!valid())return;
   if(!credentials){owner.current=null;setWorld(null);setStatus('Configure tester credentials to load outbreaks.');return;}
   if(owner.current!==credentials.username){owner.current=credentials.username;const cached=await store.cachedWorld(credentials.username);if(valid())setWorld(cached?parseWorldView(cached):null);}
   const snapshot=await fetchWorld(credentials);if(!valid())return;await store.cacheWorld(credentials.username,snapshot);setWorld(snapshot);setStatus(`Map updated ${new Date(snapshot.serverTime).toLocaleTimeString()}.`);
   if(activityId){const uploaded=await store.uploadState(activityId);if(uploaded?.state==='uploaded') {const confirmed=await fetchRecap(activityId,credentials);if(valid()){setRecap(confirmed);const old=uploaded.receipt?JSON.parse(uploaded.receipt):{};await store.markUpload(activityId,'uploaded',{...old,encounters:confirmed});}}}
  }catch(e){if(valid())setStatus(e instanceof Error?e.message:'Could not update outbreaks.');}finally{busy.current=false;}
 },[activityId]);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;generation.current++;};},[]);
 useEffect(()=>{
  generation.current++;setRecap(null);let alive=true;
  if(activityId)void store.uploadState(activityId).then(uploaded=>{if(!alive||!uploaded?.receipt)return;const raw=JSON.parse(uploaded.receipt);if(raw.encounters)setRecap(parseEncounterRecap(raw.encounters,activityId));}).catch(()=>{});
  void refresh();const timer=setInterval(()=>{if(AppState.currentState==='active')void refresh();},20000),sub=AppState.addEventListener('change',state=>{if(state==='active')void refresh();});
  return()=>{alive=false;generation.current++;clearInterval(timer);sub.remove();};
 },[activityId,refresh]);
 return {world,recap,status,refresh,acceptRecap:setRecap};
}
