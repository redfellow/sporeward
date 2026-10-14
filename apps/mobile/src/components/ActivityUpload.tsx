import { useEffect,useRef,useState } from 'react';
import { Alert,Pressable,StyleSheet,Text,View } from 'react-native';
import * as store from '../recording/store';
import { loadCredentials } from '../server/credentials';
import { ConnectionError } from '../server/client';
import { uploadActivity } from '../server/upload';
export function ActivityUpload({activity}:{activity:store.Activity}) {
 const [status,setStatus]=useState('Not uploaded.'),[busy,setBusy]=useState(false),lock=useRef(false);
 useEffect(()=>{let alive=true;void store.uploadState(activity.id).then(s=>{if(alive)setStatus(s?.state==='uploaded'?'Stored on the test server. No points awarded.':s?'Upload pending. Retry when connected.':'Not uploaded.');}).catch(()=>{if(alive)setStatus('Could not read upload status.');});return()=>{alive=false;};},[activity.id]);
 async function upload() {
  if(lock.current)return;lock.current=true;setBusy(true);
  try {
   const credentials=await loadCredentials();if(!credentials)throw new ConnectionError('Configure tester credentials in Test server first.');
   if(activity.status!=='finished'||activity.ended===null)throw new ConnectionError('Finish the activity before uploading.');
   await store.markUpload(activity.id,'pending');
   const [fixes,sections]=await Promise.all([store.points(activity.id),store.segments(activity.id)]);
   const receipt=await uploadActivity({activity:{id:activity.id,started:activity.started,ended:activity.ended,sections:sections.map(s=>({id:s.id,started:s.started,ended:s.ended??activity.ended!}))},totalFixes:fixes.length,fixes},credentials,(sent,total)=>setStatus(`Sending batch ${sent} of ${total}…`));
   await store.markUpload(activity.id,'uploaded',receipt);
   setStatus(`Stored on the test server · ${(receipt.distanceMetres/1000).toFixed(2)} km of continuous GPS coverage. ${receipt.eligibleForGame?'Basic eligibility checks passed.':'Not game-eligible: '+receipt.reasons.join(', ')+'.'} No points awarded.`);
  }catch(e){const message=e instanceof ConnectionError?e.message:'Could not complete the upload. Your local recording is preserved.';setStatus(message);try{await store.markUpload(activity.id,'pending',null,message);}catch{setStatus(message+' Upload status could not be saved.');}}finally{lock.current=false;setBusy(false);}
 }
 return <View style={styles.card}><Text style={styles.text} accessibilityLiveRegion="polite">{status}</Text><Pressable accessibilityRole="button" disabled={busy} style={[styles.button,busy&&{opacity:0.5}]} onPress={()=>Alert.alert('Upload this recording?','This sends precise GPS locations and timestamps to the Sporeward test server. It does not award points yet.',[{text:'Cancel'},{text:'Upload',onPress:()=>void upload()}])}><Text style={styles.label}>{busy?'Uploading…':'Upload recording'}</Text></Pressable></View>;
}
const styles=StyleSheet.create({card:{gap:12},text:{fontSize:14,color:'#a8c6b5',lineHeight:20},button:{padding:16,borderRadius:12,backgroundColor:'#284c3a'},label:{color:'#e6f2ea',fontSize:16,fontWeight:'600'}});
