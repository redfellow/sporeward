import {replayCommand,applyReplayCommand,publishReplayStatus,restoreReplayControl} from './src/replay/bridge';
import {useWorld} from './src/server/use-world';
import {previewEncounters} from './src/recording/encounters';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Linking, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { notificationAction } from './src/recording/notification-action';
import * as recorder from './src/recording/recorder';
import * as store from './src/recording/store';
import { type Fix, type Segment, recordingDuration, summarize } from './src/recording/model';
import { ActivityUpload } from './src/components/ActivityUpload';
import { ServerConnection } from './src/components/ServerConnection';
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
 const [details,setDetails]=useState(false);
 const operation = useRef(false), selectedId=useRef<string|null>(null);
 const handledNotificationActions=useRef(new Set<string>());
 const encounterWorld=useWorld(displayed?.id??null);
 const encounterPreview=useMemo(()=>previewEncounters(fixes,encounterWorld.world,encounterWorld.recap,Date.now()),[fixes,encounterWorld.world,encounterWorld.recap]);
 const stats=useMemo(()=>summarize(fixes),[fixes]);
 async function refresh() {
  const a = await store.current(), list = await store.recent();
  const shown = a ?? list.find(item=>item.id===selectedId.current) ?? list[0] ?? null;
  const [p,s]=shown ? await Promise.all([store.points(shown.id),store.segments(shown.id)]) : [[],[]];
  setActivity(a);setHistory(list);setDisplayed(shown);setFixes(p);setSegments(s);
  const e = await store.lastEvent(); if(e) setMessage(e.message);
  await publishReplayStatus();
 }
 async function run(action:()=>Promise<unknown>) {
  if(operation.current) return false;
  operation.current = true; setBusy(true);
  try { await action(); await refresh(); return true; } catch(e) { setMessage(String(e)); Alert.alert('Recorder',String(e)); return false; } finally { operation.current = false; setBusy(false); }
 }
 useEffect(() => {
  let alive = true;
  const update = async () => { if(operation.current) return; operation.current = true; try { await recorder.recover(); if(alive) await refresh(); } catch(e) { if(alive) setMessage(String(e)); } finally {operation.current = false;} };
  const initialize=async()=> {
   // Honor a notification action before automatic recovery changes its section identity.
   await restoreReplayControl();
   const initialUrl=await Linking.getInitialURL();
   const replay=replayCommand(initialUrl);if(replay)await run(()=>applyReplayCommand(replay));
   const action=notificationAction(initialUrl);
   if(action) {
    const key=`${action.activity}:${action.action}:${action.nonce}`;
    if(!handledNotificationActions.current.has(key)) {
     handledNotificationActions.current.add(key);if(!await run(()=>recorder.applyNotificationAction(action))) handledNotificationActions.current.delete(key);
    }
   }
   if(alive) await update();
  };
  void initialize();
  let foregroundTimer:ReturnType<typeof setTimeout>|undefined;
  const timer = setInterval(()=> { if(AppState.currentState==='active') void update(); },2000);
  const sub = AppState.addEventListener('change', state=> {void store.diagnostic('app-state',{state});if(state==='active') {clearTimeout(foregroundTimer);foregroundTimer=setTimeout(()=>void update(),250);}});
  return ()=> {alive=false;clearInterval(timer);clearTimeout(foregroundTimer);sub.remove();};
 },[]);
 useEffect(()=> {
  const handled=handledNotificationActions.current;
  let queue=Promise.resolve();
  const receive=(url:string|null)=> {
   const replay=replayCommand(url);
   if(replay){queue=queue.then(async()=>{while(operation.current)await new Promise(resolve=>setTimeout(resolve,50));await run(()=>applyReplayCommand(replay));});return;}
   const action=notificationAction(url);if(!action) return;
   const key=`${action.activity}:${action.action}:${action.nonce}`;if(handled.has(key)) return;handled.add(key);
   // A cold launch may still be recovering SQLite/service state. Serialize the action after it.
   queue=queue.then(async()=> {
    while(operation.current) await new Promise(resolve=>setTimeout(resolve,50));
    if(!await run(()=>recorder.applyNotificationAction(action))) handled.delete(key);
   });
  };
  const sub=Linking.addEventListener('url',e=>receive(e.url));
  void store.diagnostic('app-state',{state:AppState.currentState,source:'mount'});
  return ()=>sub.remove();
 },[]);
 async function exportActivity(a:store.Activity) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is unavailable on this device.');
  const [p,s,events,diagnostics]=await Promise.all([store.points(a.id),store.segments(a.id),store.diagnostics(a),store.recordingDiagnostics(a.id)]);
  const file = new File(Paths.cache,`sporeward-${a.id}.json`);
  file.create({overwrite:true});file.write(JSON.stringify({version:3,activity:a,segments:s,fixes:p,events,diagnostics,summary:summarize(p)},null,2));
  await Sharing.shareAsync(file.uri,{mimeType:'application/json',dialogTitle:'Export private GPS recording'});
 }
 function exportPrompt(a:store.Activity) { Alert.alert('Export GPS route?', 'This file contains precise locations and timestamps. Choose where to save or share it.',[{text:'Cancel'},{text:'Export',onPress:()=>void run(()=>exportActivity(a))}]); }
 const button = (label:string, action:()=>Promise<unknown>) => <Pressable accessibilityRole="button" disabled={busy} style={[styles.button,busy && {opacity:0.5}]} onPress={()=>void run(action)}><Text style={styles.buttonText}>{label}</Text></Pressable>;
 return <SafeAreaProvider><SafeAreaView style={styles.screen}><StatusBar style="light"/><ScrollView contentContainerStyle={styles.content}>
  <Text style={styles.title}>Sporeward</Text><Text style={styles.subtitle}>Outbreak field test</Text>
  <Text style={styles.body}>Touch purple outbreaks. Upload your finished outing to confirm points.</Text>
  <View style={styles.actions}>{!activity ? button('Start recording',()=>recorder.start()) : <>{activity.status==='recording' ? button('Pause',()=>recorder.pause()) : button('Resume',()=>recorder.start(true))}{button('Finish & save',()=>recorder.pause(true))}</>}</View>
  <View style={styles.card}><Text style={styles.state}>{activity?.status.toUpperCase() ?? (displayed ? 'ACTIVITY RECAP' : 'READY')}</Text>
   {displayed && !activity && <Text style={styles.body}>{new Date(displayed.started).toLocaleString()}</Text>}
   {encounterWorld.recap ? <><Text style={styles.metric}>{encounterWorld.recap.confirmedVisitPoints+encounterWorld.recap.confirmedCleanupPoints} confirmed points</Text><Text style={styles.body}>{encounterWorld.recap.confirmedVisitPoints} visit · {encounterWorld.recap.confirmedCleanupPoints} cleanup · {encounterWorld.recap.pendingCleanupPoints} possible cleanup points pending</Text></> : <><Text style={styles.metric}>{encounterPreview.provisionalPoints} provisional points · {encounterPreview.visited.size} outbreaks touched</Text><Text style={styles.body}>{encounterPreview.heldPoints>0?`${encounterPreview.heldPoints} potential visit points unlock after 500 m of continuous GPS coverage.`:'Provisional until upload and server validation.'}</Text></>}
   <Text style={styles.distance}>{(stats.meters/1000).toFixed(2)} km</Text>
   <Text style={styles.metric}>Recording time: {duration(recordingDuration(segments,Date.now()))}</Text>
   {activity && <Text style={styles.metric}>Last fix: {stats.latest ? `${Math.max(0,Math.floor((Date.now()-stats.latest.timestamp)/1000))} s ago` : 'waiting'}</Text>}
   <Text style={styles.body}>{message}</Text>
   <Pressable accessibilityRole="button" onPress={()=>setDetails(!details)}><Text style={styles.secondaryText}>{details?'Hide recording details':'Recording details'}</Text></Pressable>
   {details && <><Text style={styles.body}>Raw GPS distance · includes GPS drift</Text>
   <Text style={styles.metric}>{stats.count} fixes · {segments.length} route sections</Text>
   <Text style={styles.metric}>Longest GPS gap: {(stats.maxGap/1000).toFixed(1)} s</Text>
   <Text style={styles.metric}>{stats.gaps} gaps over 2 s · {stats.latest?.accuracy?.toFixed(0) ?? '—'} m latest accuracy</Text>
   </>}

  </View>
  <RouteMap fixes={fixes} activityId={displayed?.id ?? null} world={encounterWorld.world} visited={encounterPreview.visited} recording={activity?.status==='recording'}/>
  <Text style={styles.body}>{encounterWorld.status}</Text>
  <Pressable accessibilityRole="button" style={styles.secondary} onPress={()=>void encounterWorld.refresh()}><Text style={styles.secondaryText}>Refresh outbreaks & recap</Text></Pressable>
  {encounterWorld.world && <View style={styles.card}><Text style={styles.metric}>Test outbreaks</Text>{encounterWorld.world.outbreaks.map(o=><Text key={o.id} style={styles.body}>{o.name}{encounterPreview.visited.has(o.id)?' · touched':''}: {o.status==='cleared'?`cleared${o.clearedAt!==null&&Date.now()<=o.clearedAt+600000?' · 10-minute protection window':''}`:`${o.visitPoints} + ${o.cleanupBonus} bonus · ~${o.visitsRemaining} visits · ${o.status}`}{o.eligibleAt>Date.now()?` · revisit ${new Date(o.eligibleAt).toLocaleTimeString()}`:''}</Text>)}</View>}
  {encounterWorld.recap?.encounters.map(e=><Text key={e.outbreakId} style={styles.body}>{e.name}: {e.visitPoints+e.cleanupPoints} confirmed points · {e.reason}{e.cleanupPoints?' · cleanup bonus':''}</Text>)}
  {displayed?.status==='finished' && <Pressable accessibilityRole="button" disabled={busy} style={styles.secondary} onPress={()=>exportPrompt(displayed)}><Text style={styles.secondaryText}>Export this activity</Text></Pressable>}
  <Text style={styles.body}>Target: one fix per second. Android may deliver fixes in batches. Pause stops GPS collection; resumed sections stay separate.</Text>
  {displayed?.status==='finished' && <ActivityUpload key={displayed.id} activity={displayed} onUploaded={receipt=>{if(receipt.encounters)encounterWorld.acceptRecap(receipt.encounters);void encounterWorld.refresh();}}/>}
  <ServerConnection onChanged={()=>void encounterWorld.refresh()}/>
  <Text style={styles.heading}>Recent saved activities</Text>
  {history.filter(a=>a.status==='finished').map(a=><Pressable key={a.id} disabled={busy || !!activity} style={styles.card} onPress={()=>void run(async()=>{selectedId.current=a.id;})} accessibilityRole="button"><Text style={styles.metric}>{new Date(a.started).toLocaleString()}</Text><Text style={styles.body}>{activity ? 'Finish recording to review this activity' : 'View route and recap'}</Text></Pressable>)}
  {!history.some(a=>a.status==='finished') && <Text style={styles.body}>Finish your first test to keep its recording here.</Text>}
 </ScrollView></SafeAreaView></SafeAreaProvider>;
}
const styles = StyleSheet.create({
 screen:{flex:1,backgroundColor:'#10271f'},content:{padding:24,gap:18,width:'100%',maxWidth:700,alignSelf:'center'},title:{color:'#eef8ef',fontSize:34,fontWeight:'700'},subtitle:{color:'#b5e1c4',fontSize:20},heading:{color:'#eef8ef',fontSize:21,fontWeight:'600'},body:{color:'#a8c6b5',fontSize:15,lineHeight:22},card:{backgroundColor:'#1c3a2e',padding:20,borderRadius:18,gap:12},state:{color:'#8ce8ac',fontWeight:'700',letterSpacing:2},distance:{color:'#eef8ef',fontSize:42,fontWeight:'600'},metric:{color:'#e6f2ea',fontSize:16},actions:{flexDirection:'row',flexWrap:'wrap',gap:12},button:{backgroundColor:'#9be9b4',paddingHorizontal:22,paddingVertical:16,borderRadius:12},buttonText:{color:'#10271f',fontSize:17,fontWeight:'700'},secondary:{padding:16,borderRadius:12,backgroundColor:'#284c3a'},secondaryText:{color:'#e6f2ea',fontSize:16,fontWeight:'600'}
});
