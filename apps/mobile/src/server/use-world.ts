import {useCallback,useEffect,useRef,useState} from 'react';
import {AppState} from 'react-native';
import {parseWorldView,parseEncounterRecap,parseFieldLabOffer,type FieldLabOffer,type WorldView,type EncounterRecap} from '@sporeward/protocol';
import {loadCredentials} from './credentials';
import {fetchWorld,fetchRecap,fetchLabOffer,controlShowcaseClock,type ShowcaseClockAction} from './world';
import {SERVER_URL} from './client';
import * as store from '../recording/store';
export function useWorld(activityId:string|null) {
 const [world,setWorld]=useState<WorldView|null>(null),[recap,setRecap]=useState<EncounterRecap|null>(null),[status,setStatus]=useState('Open Menu to connect and sign in.');
 const [labOffer,setLabOffer]=useState<FieldLabOffer|null>(null);
 const busy=useRef(false),generation=useRef(0),mounted=useRef(true),owner=useRef<string|null>(null);
 const refresh=useCallback(async()=>{
  if(busy.current)return;busy.current=true;const token=generation.current;
  const valid=()=>mounted.current&&generation.current===token;
  try {
   const credentials=await loadCredentials();if(!valid())return;
   if(!credentials){owner.current=null;setWorld(null);setLabOffer(null);setStatus('Open Menu to connect and sign in.');return;}
   const player=credentials.playerId??credentials.username;
   if(owner.current!==player){owner.current=player;setRecap(null);setLabOffer(null);const cached=await store.cachedWorld(player);if(valid())setWorld(cached?parseWorldView(cached):null);}
   if(activityId){try{const cached=await store.cachedLabOffer(SERVER_URL+'|'+player,activityId);if(valid()&&cached)setLabOffer(parseFieldLabOffer(cached));}catch{}}
   const snapshot=await fetchWorld(credentials);if(!valid())return;await store.cacheWorld(player,snapshot);if(!valid())return;setWorld(snapshot);setStatus(typeof __DEV__!=='undefined'&&__DEV__&&SERVER_URL.startsWith('http://127.0.0.1:')&&snapshot.serverTime>Date.now()+60000?'Accelerated test world · reset before GPS replay.':`Map updated ${new Date(snapshot.serverTime).toLocaleTimeString()}.`);
   if(activityId&&snapshot.fieldLabs){
    try{const offer=await fetchLabOffer(activityId,credentials);if(valid()){await store.cacheLabOffer(SERVER_URL+'|'+player,activityId,offer);setLabOffer(offer);}}catch{}
   }
   if(activityId){const uploaded=await store.uploadState(activityId);if(uploaded?.state==='uploaded') {const confirmed=await fetchRecap(activityId,credentials);if(valid()){setRecap(confirmed);const old=uploaded.receipt?JSON.parse(uploaded.receipt):{};await store.markUpload(activityId,'uploaded',{...old,encounters:confirmed});}}}
  }catch(e){if(valid())setStatus(e instanceof Error?e.message:'Could not update outbreaks.');}finally{busy.current=false;}
 },[activityId]);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;generation.current++;};},[]);
 useEffect(()=>{
  generation.current++;setRecap(null);setLabOffer(null);let alive=true;
  if(activityId)void store.uploadState(activityId).then(uploaded=>{if(!alive||!uploaded?.receipt)return;const raw=JSON.parse(uploaded.receipt);if(raw.encounters)setRecap(parseEncounterRecap(raw.encounters,activityId));}).catch(()=>{});
  void refresh();const timer=setInterval(()=>{if(AppState.currentState==='active')void refresh();},20000),sub=AppState.addEventListener('change',state=>{if(state==='active')void refresh();});
  return()=>{alive=false;generation.current++;clearInterval(timer);sub.remove();};
 },[activityId,refresh]);
 const latestRefresh=useRef(refresh);latestRefresh.current=refresh;
 const resetIdentity=useCallback(async()=>{
  generation.current++;owner.current=null;setWorld(null);setRecap(null);setLabOffer(null);setStatus('Loading tester world…');
  while(busy.current&&mounted.current)await new Promise(resolve=>setTimeout(resolve,25));
  if(mounted.current)await latestRefresh.current();
 },[]);
 const controlRenderTestClock=useCallback(async(action:ShowcaseClockAction,minutes?:number)=>{
  try{
   const credentials=await loadCredentials();if(!credentials)throw new Error('Connect to the isolated render showcase first.');
   const snapshot=await controlShowcaseClock(action,credentials,minutes),player=credentials.playerId??credentials.username;
   await store.cacheWorld(player,snapshot);owner.current=player;if(mounted.current){setWorld(snapshot);setStatus('Showcase clock '+(snapshot.renderTest!.clock!.paused?'paused.':'running.'));}
  }catch(e){if(mounted.current)setStatus(e instanceof Error?e.message:'Showcase clock control failed.');throw e;}
 },[]);
 return {world,recap,labOffer,status,refresh,resetIdentity,acceptRecap:setRecap,controlRenderTestClock};
}
