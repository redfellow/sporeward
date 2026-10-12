import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as recorder from './src/recording/recorder';
import * as store from './src/recording/store';
import { type Fix, type Segment, recordingDuration, summarize } from './src/recording/model';
import { RouteMap } from './src/components/RouteMap';
const duration = (ms:number) => {const seconds=Math.floor(ms/1000);return `${Math.floor(seconds/3600)}h ${Math.floor(seconds/60)%60}m ${seconds%60}s`;};
export default function App() {
 const [activity,setActivity] = useState<store.Activity | null>(null);
 const [displayed,setDisplayed] = useState<store.Activity | null>(null);
 const [history,setHistory] = useState<store.Activity[]>([]);
 const [fixes,setFixes] = useState<Fix[]>([]);
 const [segments,setSegments] = useState<Segment[]>([]);
 const [message,setMessage] = useState('Ready for a recording test.');
 const [busy,setBusy] = useState(false);
 const operation = useRef(false), selectedId=useRef<string|null>(null);
 const stats=useMemo(()=>summarize(fixes),[fixes]);
 async function refresh() {
  const a = await store.current(), list = await store.recent();
  const shown = a ?? list.find(item=>item.id===selectedId.current) ?? list[0] ?? null;
  const [p,s]=shown ? await Promise.all([store.points(shown.id),store.segments(shown.id)]) : [[],[]];
  setActivity(a);setHistory(list);setDisplayed(shown);setFixes(p);setSegments(s);
  const e = await store.lastEvent(); if(e) setMessage(e.message);
 }
 async function run(action:()=>Promise<unknown>) {
  if(operation.current) return;
  operation.current = true; setBusy(true);
  try { await action(); await refresh(); } catch(e) { setMessage(String(e)); Alert.alert('Recorder',String(e)); } finally { operation.current = false; setBusy(false); }
 }
 useEffect(() => {
  let alive = true;
  const update = async () => { if(operation.current) return; operation.current = true; try { await recorder.recover(); if(alive) await refresh(); } catch(e) { if(alive) setMessage(String(e)); } finally {operation.current = false;} };
  void update();
  const timer = setInterval(()=> { if(AppState.currentState==='active') void update(); },2000);
  const sub = AppState.addEventListener('change', state=> {if(state==='active') void update();});
  return ()=> {alive=false;clearInterval(timer);sub.remove();};
 },[]);
 async function exportActivity(a:store.Activity) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is unavailable on this device.');
  const [p,s,events]=await Promise.all([store.points(a.id),store.segments(a.id),store.diagnostics(a)]);
  const file = new File(Paths.cache,`sporeward-${a.id}.json`);
  file.create({overwrite:true});file.write(JSON.stringify({version:2,activity:a,segments:s,fixes:p,events,summary:summarize(p)},null,2));
  await Sharing.shareAsync(file.uri,{mimeType:'application/json',dialogTitle:'Export private GPS recording'});
 }
 function exportPrompt(a:store.Activity) { Alert.alert('Export GPS route?', 'This file contains precise locations and timestamps. Choose where to save or share it.',[{text:'Cancel'},{text:'Export',onPress:()=>void run(()=>exportActivity(a))}]); }
 const button = (label:string, action:()=>Promise<unknown>) => <Pressable accessibilityRole="button" disabled={busy} style={[styles.button,busy && {opacity:0.5}]} onPress={()=>void run(action)}><Text style={styles.buttonText}>{label}</Text></Pressable>;
 return <SafeAreaProvider><SafeAreaView style={styles.screen}><StatusBar style="light"/><ScrollView contentContainerStyle={styles.content}>
  <Text style={styles.title}>Sporeward</Text><Text style={styles.subtitle}>Field recorder</Text>
  <Text style={styles.body}>Your route stays on this phone. Outbreaks and scoring are coming next.</Text>
  <View style={styles.actions}>{!activity ? button('Start recording',()=>recorder.start()) : <>{activity.status==='recording' ? button('Pause',()=>recorder.pause()) : button('Resume',()=>recorder.start(true))}{button('Finish & save',()=>recorder.pause(true))}</>}</View>
  <View style={styles.card}><Text style={styles.state}>{activity?.status.toUpperCase() ?? (displayed ? 'ACTIVITY RECAP' : 'READY')}</Text>
   {displayed && <Text style={styles.body}>{new Date(displayed.started).toLocaleString()}</Text>}
   <Text style={styles.distance}>{(stats.meters/1000).toFixed(2)} km</Text><Text style={styles.body}>Raw GPS distance · includes GPS drift</Text>
   <Text style={styles.metric}>Recording time: {duration(recordingDuration(segments,Date.now()))}</Text>
   <Text style={styles.metric}>{stats.count} fixes · {segments.length} route sections</Text>
   <Text style={styles.metric}>Longest GPS gap: {(stats.maxGap/1000).toFixed(1)} s</Text>
   <Text style={styles.metric}>{stats.gaps} gaps over 2 s · {stats.latest?.accuracy?.toFixed(0) ?? '—'} m latest accuracy</Text>
   {activity && <Text style={styles.metric}>Last fix: {stats.latest ? `${Math.max(0,Math.floor((Date.now()-stats.latest.timestamp)/1000))} s ago` : 'waiting'}</Text>}
   <Text style={styles.body}>{message}</Text>
  </View>
  <RouteMap fixes={fixes} activityId={displayed?.id ?? null}/>
  {displayed?.status==='finished' && <Pressable accessibilityRole="button" disabled={busy} style={styles.secondary} onPress={()=>exportPrompt(displayed)}><Text style={styles.secondaryText}>Export this activity</Text></Pressable>}
  <Text style={styles.body}>Target: one fix per second. Android may deliver fixes in batches. Pause stops GPS collection; resumed sections stay separate.</Text>
  <Text style={styles.heading}>Recent saved activities</Text>
  {history.filter(a=>a.status==='finished').map(a=><Pressable key={a.id} disabled={busy || !!activity} style={styles.card} onPress={()=>void run(async()=>{selectedId.current=a.id;})} accessibilityRole="button"><Text style={styles.metric}>{new Date(a.started).toLocaleString()}</Text><Text style={styles.body}>{activity ? 'Finish recording to review this activity' : 'View route and recap'}</Text></Pressable>)}
  {!history.some(a=>a.status==='finished') && <Text style={styles.body}>Finish your first test to keep its recording here.</Text>}
 </ScrollView></SafeAreaView></SafeAreaProvider>;
}
const styles = StyleSheet.create({
 screen:{flex:1,backgroundColor:'#10271f'},content:{padding:24,gap:18,width:'100%',maxWidth:700,alignSelf:'center'},title:{color:'#eef8ef',fontSize:34,fontWeight:'700'},subtitle:{color:'#b5e1c4',fontSize:20},heading:{color:'#eef8ef',fontSize:21,fontWeight:'600'},body:{color:'#a8c6b5',fontSize:15,lineHeight:22},card:{backgroundColor:'#1c3a2e',padding:20,borderRadius:18,gap:12},state:{color:'#8ce8ac',fontWeight:'700',letterSpacing:2},distance:{color:'#eef8ef',fontSize:42,fontWeight:'600'},metric:{color:'#e6f2ea',fontSize:16},actions:{flexDirection:'row',flexWrap:'wrap',gap:12},button:{backgroundColor:'#9be9b4',paddingHorizontal:22,paddingVertical:16,borderRadius:12},buttonText:{color:'#10271f',fontSize:17,fontWeight:'700'},secondary:{padding:16,borderRadius:12,backgroundColor:'#284c3a'},secondaryText:{color:'#e6f2ea',fontSize:16,fontWeight:'600'}
});
