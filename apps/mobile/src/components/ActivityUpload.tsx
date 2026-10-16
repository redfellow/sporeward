import type {ActivityReceipt} from '@sporeward/protocol';
import {useEffect,useRef,useState} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import * as store from '../recording/store';
import {syncActivity} from '../server/sync';
export function ActivityUpload({activity,onUploaded,compact=false}:{activity:store.Activity;compact?:boolean;onUploaded?:(receipt:ActivityReceipt)=>void}){
 const [status,setStatus]=useState('Recording saved.'),[busy,setBusy]=useState(false),[uploaded,setUploaded]=useState(false);
 const lock=useRef(false),mounted=useRef(true),callback=useRef(onUploaded);callback.current=onUploaded;
 function confirmed(receipt:ActivityReceipt){
  if(!mounted.current)return;
  setUploaded(true);setStatus(receipt.eligibleForGame?'Uploaded · score confirmed.':'Uploaded · activity did not meet game eligibility.');callback.current?.(receipt);
 }
 async function upload(){
  if(lock.current)return;lock.current=true;if(mounted.current){setBusy(true);setStatus('Confirming score…');}
  try{const receipt=await syncActivity(activity.id,(sent,total)=>{if(mounted.current)setStatus(`Sending batch ${sent} of ${total}…`);});confirmed(receipt);}
  catch(e){if(mounted.current)setStatus(e instanceof Error?e.message:'Upload pending. Your recording is saved.');}
  finally{lock.current=false;if(mounted.current)setBusy(false);}
 }
 useEffect(()=>{
  mounted.current=true;setUploaded(false);
  void store.uploadState(activity.id).then(s=>{if(!mounted.current)return;if(s?.state==='uploaded'&&s.receipt)confirmed(JSON.parse(s.receipt));else if(s?.state==='pending')void upload();else setStatus('Recording saved. Upload to include it in your score.');}).catch(()=>{if(mounted.current)setStatus('Could not read upload status.');});
  return()=>{mounted.current=false;};
 },[activity.id]);
 return <View style={styles.card}><Text style={styles.text} accessibilityLiveRegion="polite">{status}</Text>{!uploaded&&<Pressable accessibilityRole="button" disabled={busy} style={[styles.button,busy&&{opacity:.5}]} onPress={()=>void upload()}><Text style={styles.label}>{busy?'Confirming…':compact?'Retry upload':'Upload recording'}</Text></Pressable>}</View>;
}
const styles=StyleSheet.create({card:{gap:12},text:{fontSize:14,color:'#a8c6b5',lineHeight:20},button:{padding:16,borderRadius:12,backgroundColor:'#284c3a'},label:{color:'#e6f2ea',fontSize:16,fontWeight:'600'}});
