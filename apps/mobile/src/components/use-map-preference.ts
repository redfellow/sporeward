import {useEffect,useRef,useState} from 'react';
import * as SecureStore from 'expo-secure-store';
const KEY='sporeward.bright-map';
/** One app-level preference, passed to every map including recaps. */
export function useMapPreference(){
 const [bright,setBright]=useState(false),changed=useRef(false),saving=useRef(Promise.resolve());
 useEffect(()=>{let alive=true;void SecureStore.getItemAsync(KEY).then(value=>{if(alive&&!changed.current)setBright(value==='true');}).catch(()=>{});return()=>{alive=false;};},[]);
 const update=(value:boolean)=>{changed.current=true;setBright(value);saving.current=saving.current.catch(()=>{}).then(()=>SecureStore.setItemAsync(KEY,String(value))).catch(error=>console.warn('Map preference could not be saved.',error instanceof Error?error.message:''));};
 return [bright,update] as const;
}
