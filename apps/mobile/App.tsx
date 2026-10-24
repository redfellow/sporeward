import {FieldGuide} from './src/components/FieldGuide';
import {MapAttribution} from './src/components/MapAttribution';
import {syncPendingActivities} from './src/server/sync';
import {TesterScores} from './src/components/TesterScores';
import {savedSession} from './src/server/session';
import {TesterAccount} from './src/components/TesterAccount';
import {OutingRecap} from './src/components/OutingRecap';
import {replayCommand,applyReplayCommand,publishReplayStatus,restoreReplayControl} from './src/replay/bridge';
import {useWorld} from './src/server/use-world';
import {useEncounters} from './src/recording/use-encounters';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, BackHandler, Linking, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {confirmFinish} from './src/recording/confirm-finish';
import { notificationRevision, type NotificationAction, notificationAction } from './src/recording/notification-action';
import * as recorder from './src/recording/recorder';
import * as store from './src/recording/store';
import { type Fix, type Segment, recordingDuration, summarize } from './src/recording/model';
import { ActivityUpload } from './src/components/ActivityUpload';
import { ServerConnection } from './src/components/ServerConnection';
import {useMapPreference} from './src/components/use-map-preference';
import { RouteMap } from './src/components/RouteMap';
import type {DestinationFocus} from './src/components/destination-focus';
import {OutingThumbnail} from './src/components/OutingThumbnail';
import {loadCredentials} from './src/server/credentials';
import {fetchActivityFootprints} from './src/server/world';
import {parseEncounterRecap,type ActivityFootprint, type EncounterRecap} from '@sporeward/protocol';
const duration = (ms:number) => {const seconds=Math.floor(ms/1000);return `${Math.floor(seconds/3600)}h ${Math.floor(seconds/60)%60}m ${seconds%60}s`;};
const NO_FOOTPRINTS:ActivityFootprint[]=[];
export default function App(){return <SafeAreaProvider initialMetrics={initialWindowMetrics}><Game/></SafeAreaProvider>;}
function Game() {
 const [brightMap,setBrightMap]=useMapPreference();
 const [activity,setActivity] = useState<store.Activity | null>(null);
 const [displayed,setDisplayed] = useState<store.Activity | null>(null);
 const [history,setHistory] = useState<store.Activity[]>([]);
 const [fixes,setFixes] = useState<Fix[]>([]);
 const [segments,setSegments] = useState<Segment[]>([]);
 const [identityGeneration,setIdentityGeneration]=useState(0);
 const [hudHeight,setHudHeight]=useState(260);
 const [topHudHeight,setTopHudHeight]=useState(76);
 const compact=useWindowDimensions().width<380;
 const [screen,setScreen]=useState<'map'|'details'|'recap'|'recap-details'|'outings'|'review'>('map');
 const [message,setMessage] = useState('Ready for a recording test.');
 const [busy,setBusy] = useState(false);
 const [details,setDetails]=useState(false);
 const [guideOpen,setGuideOpen]=useState(false);
 const [destination,setDestination]=useState<DestinationFocus|null>(null);
 const destinationWorld=useRef<number|null>(null);
 useEffect(()=>{if(screen!=='map')setGuideOpen(false);},[screen]);
 const recordingActive=useRef(false);
 const operation = useRef(false), selectedId=useRef<string|null>(null);
 const recapOrigin=useRef<'map'|'outings'>('map');
 const [historyPreviews,setHistoryPreviews]=useState<Record<string,{fixes:Fix[];segments:Segment[];footprints:ActivityFootprint[];recap:EncounterRecap|null;provisionalPoints:number;contacts:number;pending:boolean}>>({});
 const [historicalSnapshot,setHistoricalSnapshot]=useState<{activityId:string;footprints:ActivityFootprint[]}|null>(null);
 const historyGeneration=useRef(0);
 const handledNotificationActions=useRef(new Set<string>());
 const encounterWorld=useWorld(displayed?.id??null);
 useEffect(()=>{
  const started=encounterWorld.world?.worldStartedAt;if(started===undefined)return;
  if(destinationWorld.current!==null&&destinationWorld.current!==started)setDestination(null);
  destinationWorld.current=started;
 },[encounterWorld.world?.worldStartedAt]);
 const encounterPreview=useEncounters(displayed?.id??null,fixes,encounterWorld.world,encounterWorld.recap);
 const shownRecap=encounterWorld.recap?.activityId===displayed?.id?encounterWorld.recap:historyPreviews[displayed?.id??'']?.recap??null;
 const historicalFootprints=historicalSnapshot&&historicalSnapshot.activityId===displayed?.id?historicalSnapshot.footprints:historyPreviews[displayed?.id??'']?.footprints??NO_FOOTPRINTS;
 const finishedId=displayed?.status==='finished'?displayed.id:null;
 const hasRecap=!!shownRecap;
 useEffect(()=>{
  let alive=true;setHistoricalSnapshot(null);
  if(!finishedId||!hasRecap)return;
  void loadCredentials().then(async credentials=>{if(!credentials)return;const result=await fetchActivityFootprints(finishedId,credentials);if(alive)setHistoricalSnapshot(result);}).catch(()=>{});
  return()=>{alive=false;};
 },[finishedId,hasRecap,identityGeneration]);
 const stats=useMemo(()=>summarize(fixes),[fixes]);
 async function refresh() {
  const owner=(await savedSession(true))?.tester.id??'legacy-local';
  const a = await store.current(), list = await store.recent(owner);
  const shown = a ?? list.find(item=>item.id===selectedId.current) ?? null;
  const [p,s]=shown ? await Promise.all([store.points(shown.id),store.segments(shown.id)]) : [[],[]];
  recordingActive.current=a?.status==='recording';
  setActivity(a);setHistory(list);setDisplayed(shown);setFixes(p);setSegments(s);
  const e = await store.lastEvent(); if(e) setMessage(e.message);
  await publishReplayStatus();
 }
 async function run(action:()=>Promise<unknown>) {
  if(operation.current) return false;
  operation.current = true; setBusy(true);
  try { await action(); await refresh(); return true; } catch(e) { setMessage(String(e)); Alert.alert('Recorder',String(e)); return false; } finally { operation.current = false; setBusy(false); }
 }
 async function applyReplayWithDestinationReset(command:NonNullable<ReturnType<typeof replayCommand>>){
  if(command.action==='reset-world'||command.action==='sign-in')setDestination(null);
  await applyReplayCommand(command);
 }
 async function finishOuting() {
  if(!await confirmFinish())return;
  selectedId.current=(await store.current())?.id??null;recapOrigin.current='map';await recorder.pause(true);setScreen('recap');
 }
 async function userNotificationAction(action:NotificationAction) {
  if(action.action==='finish') {
   const current=await store.current();
   if(!current||current.id!==action.activity||notificationRevision(await store.segments(current.id))!==action.nonce)return;
   if(!await confirmFinish()) {
    handledNotificationActions.current.delete(`${action.activity}:${action.action}:${action.nonce}`);
    return;
   }
  }
  if(action.action==='finish'){selectedId.current=action.activity;recapOrigin.current='map';}
  await recorder.applyNotificationAction(action);
  if(action.action==='finish')setScreen('recap');
 }
 useEffect(() => {
  const synchronize=()=>{if(AppState.currentState==='active')void syncPendingActivities().then(()=>encounterWorld.refresh()).catch(()=>{});};
  synchronize();const retryTimer=setInterval(synchronize,60000);
  const retrySub=AppState.addEventListener('change',state=>{if(state==='active')synchronize();});
  return()=>{clearInterval(retryTimer);retrySub.remove();};
 },[]);
 useEffect(()=>{
  const sub=BackHandler.addEventListener('hardwareBackPress',()=>{
   if(screen==='recap'){setScreen(recapOrigin.current);return true;}
   if(screen==='recap-details'||screen==='review'){setScreen('recap');return true;}
   if(screen==='outings'){setScreen('map');return true;}
   return false;
  });return()=>sub.remove();
 },[screen]);
 async function loadHistoryCards(items:store.Activity[]){
  const generation=historyGeneration.current;
  const credentials=await loadCredentials().catch(()=>null);
  const rows=await Promise.all(items.filter(a=>a.status==='finished').map(async a=>{
   const [points,sections,upload,localContacts]=await Promise.all([store.points(a.id),store.segments(a.id),store.uploadState(a.id),store.contactPreviews(a.id)]);
   let recap:EncounterRecap|null=null;let footprints:ActivityFootprint[]=[];
   try{if(upload?.state==='uploaded'&&upload.receipt){const value=JSON.parse(upload.receipt) as {encounters?:unknown};if(value.encounters)recap=parseEncounterRecap(value.encounters,a.id);}
    if(credentials&&upload?.state==='uploaded')footprints=(await fetchActivityFootprints(a.id,credentials)).footprints;
   }catch{/* Older uploads can lack saved encounter geometry; keep their GPS route preview. */}
   return [a.id,{fixes:points,segments:sections,footprints,recap,provisionalPoints:localContacts.reduce((total,c)=>total+c.visitPoints,0),contacts:localContacts.length,pending:upload?.state!=='uploaded'}] as const;
  }));if(generation===historyGeneration.current)setHistoryPreviews(Object.fromEntries(rows));
 }
 async function showHistory(){setScreen('outings');const generation=++historyGeneration.current;try{const owner=(await savedSession(true))?.tester.id??'legacy-local',items=await store.recent(owner);if(generation!==historyGeneration.current)return;setHistory(items);void loadHistoryCards(items).catch(()=>{});}catch{}}
 useEffect(() => {
  let alive = true;
  const update = async () => { if(operation.current) return; operation.current = true; try { await recorder.recover(); if(alive) await refresh(); } catch(e) { if(alive) setMessage(String(e)); } finally {operation.current = false;} };
  const initialize=async()=> {
   // Honor a notification action before automatic recovery changes its section identity.
   await restoreReplayControl();
   const initialUrl=await Linking.getInitialURL();
   const replay=replayCommand(initialUrl);if(replay)await run(()=>applyReplayWithDestinationReset(replay));
   const action=notificationAction(initialUrl);
   if(action) {
    const key=`${action.activity}:${action.action}:${action.nonce}`;
    if(!handledNotificationActions.current.has(key)) {
     handledNotificationActions.current.add(key);if(!await run(()=>userNotificationAction(action))) handledNotificationActions.current.delete(key);
    }
   }
   if(alive) await update();
  };
  void initialize();
  let foregroundTimer:ReturnType<typeof setTimeout>|undefined;
  const timer = setInterval(()=> { if(AppState.currentState==='active'&&recordingActive.current) void update(); },2000);
  const sub = AppState.addEventListener('change', state=> {void store.diagnostic('app-state',{state});if(state==='active') {clearTimeout(foregroundTimer);foregroundTimer=setTimeout(()=>void update(),250);}});
  return ()=> {alive=false;clearInterval(timer);clearTimeout(foregroundTimer);sub.remove();};
 },[]);
 useEffect(()=> {
  const handled=handledNotificationActions.current;
  let queue=Promise.resolve();
  const receive=(url:string|null)=> {
   const replay=replayCommand(url);
   if(replay){queue=queue.then(async()=>{while(operation.current)await new Promise(resolve=>setTimeout(resolve,50));await run(()=>applyReplayWithDestinationReset(replay));});return;}
   const action=notificationAction(url);if(!action) return;
   const key=`${action.activity}:${action.action}:${action.nonce}`;if(handled.has(key)) return;handled.add(key);
   // A cold launch may still be recovering SQLite/service state. Serialize the action after it.
   queue=queue.then(async()=> {
    while(operation.current) await new Promise(resolve=>setTimeout(resolve,50));
    if(!await run(()=>userNotificationAction(action))) handled.delete(key);
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
 async function returnToWorld() {
  selectedId.current=null;setDisplayed(null);setFixes([]);setSegments([]);setScreen('map');await refresh();
 }
 if(guideOpen&&screen==='map')return <SafeAreaView style={styles.screen}><StatusBar style="light"/><FieldGuide brightMap={brightMap} onClose={()=>setGuideOpen(false)}/></SafeAreaView>;
 if(screen==='outings')return <SafeAreaView style={styles.screen}><StatusBar style="light"/><ScrollView contentContainerStyle={styles.content}>
  <Pressable accessibilityRole="button" style={styles.secondary} onPress={()=>void run(returnToWorld)}><Text style={styles.secondaryText}>Back to the world</Text></Pressable>
  <Text style={styles.title}>Past outings</Text>
  {history.filter(a=>a.status==='finished').map(a=>{const preview=historyPreviews[a.id],summary=summarize(preview?.fixes??[]),elapsed=preview?duration(recordingDuration(preview.segments,a.ended??a.started)):'';const points=preview?.recap?preview.recap.confirmedVisitPoints+preview.recap.confirmedCleanupPoints:preview?.provisionalPoints;return <Pressable key={a.id} disabled={busy||!!activity} style={styles.historyCard} onPress={()=>void run(async()=>{recapOrigin.current='outings';selectedId.current=a.id;await refresh();setScreen('recap');})} accessibilityRole="button">
   <View style={styles.historyHeading}><View style={{flex:1}}><Text style={styles.metric}>{new Date(a.started).toLocaleString()}</Text><Text style={styles.body}>{preview?`${(summary.meters/1000).toFixed(2)} km · ${elapsed}`:'Loading outing…'}</Text></View><View style={styles.historyScore}><Text style={styles.historyPoints}>{points===undefined?'—':preview?.pending||!preview?.recap?'~'+points:points}</Text><Text style={styles.smallLabel}>{preview?.pending?'pending':preview?.recap?'confirmed':'estimate'}</Text>{!!preview?.recap?.pendingCleanupPoints&&<Text style={styles.pendingPoints}>+{preview.recap.pendingCleanupPoints} possible</Text>}</View></View>
   {preview&&<OutingThumbnail fixes={preview.fixes} footprints={preview.footprints} brightMap={brightMap}/>}
   <Text style={styles.body}>{preview?(preview.pending?'Waiting to upload':'Uploaded'):'Loading…'} · Open full-screen recap</Text>
  </Pressable>})}
  {!history.some(a=>a.status==='finished')&&<Text style={styles.body}>Your saved outings will appear here.</Text>}
  {!!activity&&<Text style={styles.body}>Finish your current outing to review past outings.</Text>}
 </ScrollView></SafeAreaView>;
 if(screen==='review')return <SafeAreaView style={styles.screen}><StatusBar style="light"/><View style={{flex:1}}><RouteMap brightMap={brightMap} fixes={fixes} activityId={displayed?.id??null} world={encounterWorld.world} labOffer={encounterWorld.labOffer} labRecap={encounterWorld.recap} visited={encounterPreview.visited} recording={false} fullscreen historicalOnly historicalFootprints={historicalFootprints} topInset={64} bottomInset={20}/><Pressable accessibilityRole="button" style={[styles.gameMenu,{position:'absolute',top:12,left:12}]} onPress={()=>setScreen('recap')}><Text style={styles.secondaryText}>Back to recap</Text></Pressable></View><MapAttribution/></SafeAreaView>;
 if(screen==='recap'&&displayed?.status==='finished')return <SafeAreaView style={styles.screen}><StatusBar style="light"/><View style={{flex:1}}><RouteMap brightMap={brightMap} fixes={fixes} activityId={displayed.id} world={encounterWorld.world} labOffer={encounterWorld.labOffer} labRecap={encounterWorld.recap} visited={encounterPreview.visited} recording={false} fullscreen historicalOnly historicalFootprints={historicalFootprints} topInset={145} bottomInset={130}/>
   <Pressable accessibilityRole="button" accessibilityLabel="Back" style={[styles.gameMenu,{position:'absolute',top:12,left:12}]} onPress={()=>setScreen(recapOrigin.current)}><Text style={styles.secondaryText}>‹</Text></Pressable>
  <View style={styles.recapScore}><Text style={styles.recapPoints}>{shownRecap?shownRecap.confirmedVisitPoints+shownRecap.confirmedCleanupPoints:recapOrigin.current==='outings'?historyPreviews[displayed.id]?.provisionalPoints??0:encounterPreview.provisionalPoints} pts</Text><Text style={styles.body}>{shownRecap?'Confirmed':historyPreviews[displayed.id]?.pending?'Pending confirmation':'Provisional'} · {shownRecap?.encounters.filter(e=>e.accepted).length??(historicalFootprints.length||historyPreviews[displayed.id]?.contacts||encounterPreview.visited.size)} touched</Text>{!!shownRecap?.pendingCleanupPoints&&<Text style={styles.pendingPoints}>+{shownRecap.pendingCleanupPoints} possible cleanup</Text>}<Text style={styles.metric}>{(stats.meters/1000).toFixed(2)} km · {duration(recordingDuration(segments,displayed.ended??Date.now()))}</Text></View>
   <View style={styles.recapActions}><Pressable accessibilityRole="button" style={styles.recapButton} onPress={()=>setScreen('recap-details')}><Text style={styles.buttonText}>Outing details</Text></Pressable><Pressable accessibilityRole="button" style={styles.recapButtonSecondary} onPress={()=>{if(recapOrigin.current==='outings')setScreen('outings');else void run(returnToWorld);}}><Text style={styles.secondaryText}>{recapOrigin.current==='outings'?'Close recap':'Back to the map'}</Text></Pressable></View>
  </View><MapAttribution/></SafeAreaView>;
 if(screen==='recap-details'&&displayed?.status==='finished')return <SafeAreaView style={styles.screen}><StatusBar style="light"/><OutingRecap activity={displayed} distance={stats.meters} elapsed={duration(recordingDuration(segments,displayed.ended??Date.now()))} recap={shownRecap} provisional={recapOrigin.current==='outings'?historyPreviews[displayed.id]?.provisionalPoints??0:encounterPreview.provisionalPoints} touched={shownRecap?.encounters.filter(e=>e.accepted).length??(historicalFootprints.length||historyPreviews[displayed.id]?.contacts||encounterPreview.visited.size)} coverage={encounterPreview.distanceMetres} onMap={()=>setScreen('recap')} onRoute={()=>setScreen('review')} onUploaded={receipt=>{if(receipt.encounters)encounterWorld.acceptRecap(receipt.encounters);void encounterWorld.refresh();}}/></SafeAreaView>;
 if(screen==='map')return <SafeAreaView style={styles.screen}><StatusBar style="light"/><View style={{flex:1}}>
  <RouteMap brightMap={brightMap} fixes={fixes} activityId={displayed?.id??null} world={encounterWorld.world} labOffer={encounterWorld.labOffer} labRecap={encounterWorld.recap} visited={encounterPreview.visited} recording={activity?.status==='recording'} fullscreen bottomInset={hudHeight} topInset={topHudHeight} destination={destination} onDestinationChange={setDestination} destinationActivityId={activity?.id??null} onRenderTestClock={encounterWorld.controlRenderTestClock}/>
  <Pressable accessibilityRole="button" accessibilityLabel="Open field guide" onPress={()=>setGuideOpen(true)} style={[styles.gameMenu,{position:'absolute',top:topHudHeight+12,right:16,minWidth:44,minHeight:44,borderRadius:22,alignItems:'center',justifyContent:'center'}]}><Text style={styles.smallLabel}>?</Text></Pressable>
  <View style={styles.gameTop} pointerEvents="box-none" onLayout={event=>setTopHudHeight(Math.ceil(event.nativeEvent.layout.height)+24)}><View style={styles.gamePanel}>
   <View style={styles.gameRow}><Text style={styles.gameTitle}>Sporeward</Text><View style={{flexDirection:'row',gap:8}}><Pressable accessibilityRole="button" accessibilityLabel="Past outings" onPress={()=>void showHistory()} style={styles.gameMenu}><Text style={styles.smallLabel}>Outings</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Open setup" onPress={()=>setScreen('details')} style={styles.gameMenu}><Text style={styles.smallLabel}>☰</Text></Pressable></View></View>
   {!encounterWorld.status.startsWith('Map updated')&&<Text style={styles.body} accessibilityLiveRegion="polite">{encounterWorld.status}</Text>}
  </View></View>
  <View style={[styles.gameBottom,!activity&&styles.idleBottom]} onLayout={event=>setHudHeight(Math.ceil(event.nativeEvent.layout.height)+24)}>{activity&&<><View style={styles.gameRow}>
   <Text style={[styles.distance,compact&&{fontSize:32}]}>{(stats.meters/1000).toFixed(2)} <Text style={styles.metric}>km</Text></Text>
   <View style={{flexShrink:1}}><Text style={styles.gameScore}>{encounterWorld.recap?encounterWorld.recap.confirmedVisitPoints+encounterWorld.recap.confirmedCleanupPoints:encounterPreview.provisionalPoints} pts</Text><Text style={styles.body}>{encounterWorld.recap?'Confirmed':'Provisional'} · {encounterPreview.visited.size} touched</Text></View>
  </View><Text style={styles.metric}>{duration(recordingDuration(segments,Date.now()))}{activity?.status==='paused'?' · Paused':''}</Text>
   {!encounterWorld.recap&&encounterPreview.heldPoints>0&&<Text style={styles.body}>{encounterPreview.heldPoints} potential visit points · reach 500 m of GPS coverage to qualify</Text>}
   {encounterWorld.recap?.pendingCleanupPoints? <Text style={styles.body}>+{encounterWorld.recap.pendingCleanupPoints} possible cleanup points pending</Text>:null}
   </>}
   <View style={styles.actions}>{!activity?(encounterWorld.world?.renderTest?<Text style={styles.body}>Isolated render test · outing recording disabled</Text>:button('Start outing',()=>recorder.start())):<>{activity.status==='recording'?button('Pause',()=>recorder.pause()):button('Resume',()=>recorder.start(true))}{button('Finish',finishOuting)}</>}</View>

  </View>
 </View><MapAttribution/></SafeAreaView>;
 return <SafeAreaView style={styles.screen}><StatusBar style="light"/><ScrollView contentContainerStyle={styles.content}>
  <Pressable accessibilityRole="button" onPress={()=>void run(returnToWorld)} style={styles.secondary}><Text style={styles.secondaryText}>Back to map</Text></Pressable><Text style={styles.title}>Sporeward</Text><Text style={styles.subtitle}>Outbreak field test</Text>
  <Text style={styles.body}>Choose a detour, push back the spores, and finish your outing to confirm your score.</Text>
  <TesterAccount disabled={!!activity} onChanged={()=>{setDestination(null);historyGeneration.current++;setIdentityGeneration(n=>n+1);selectedId.current=null;setDisplayed(null);setHistory([]);setHistoryPreviews({});setHistoricalSnapshot(null);setFixes([]);setSegments([]);void refresh();void encounterWorld.resetIdentity();}}/>
  <ServerConnection locked={!!activity} onChanged={()=>{setDestination(null);void encounterWorld.refresh();}}/>
  <View style={[styles.card,{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}]}><View><Text style={styles.state}>Bright map</Text><Text style={styles.body}>Use a lighter map background</Text></View><Switch accessibilityLabel="Bright map" value={brightMap} onValueChange={setBrightMap}/></View>
  <TesterScores key={identityGeneration}/>

  <View style={styles.actions}>{!activity ? button('Start recording',()=>recorder.start()) : <>{activity.status==='recording' ? button('Pause',()=>recorder.pause()) : button('Resume',()=>recorder.start(true))}{button('Finish & save',finishOuting)}</>}</View>
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
  {details&&<RouteMap brightMap={brightMap} fixes={fixes} activityId={displayed?.id ?? null} world={encounterWorld.world} labOffer={encounterWorld.labOffer} labRecap={encounterWorld.recap} visited={encounterPreview.visited} recording={activity?.status==='recording'}/>}
  <Text style={styles.body}>{encounterWorld.status}</Text>
  <Pressable accessibilityRole="button" style={styles.secondary} onPress={()=>void encounterWorld.refresh()}><Text style={styles.secondaryText}>Refresh outbreaks & recap</Text></Pressable>
  {details&&encounterWorld.world && <View style={styles.card}><Text style={styles.metric}>Test outbreaks</Text>{encounterWorld.world.outbreaks.map(o=><Text key={o.id} style={styles.body}>{o.name}{encounterPreview.visited.has(o.id)?' · touched':''}: {o.status==='cleared'?`cleared${o.clearedAt!==null&&Date.now()<=o.clearedAt+600000?' · 10-minute protection window':''}`:`${o.visitPoints} + ${o.cleanupBonus} bonus · ~${o.visitsRemaining} visits · ${o.status}`}{o.eligibleAt>Date.now()?` · revisit ${new Date(o.eligibleAt).toLocaleTimeString()}`:''}</Text>)}</View>}
  {encounterWorld.recap?.encounters.map(e=><Text key={e.outbreakId} style={styles.body}>{e.name}: {e.visitPoints+e.cleanupPoints} confirmed points · {e.reason}{e.cleanupPoints?' · cleanup bonus':''}</Text>)}
  {displayed?.status==='finished' && <Pressable accessibilityRole="button" disabled={busy} style={styles.secondary} onPress={()=>exportPrompt(displayed)}><Text style={styles.secondaryText}>Export this activity</Text></Pressable>}
  <Text style={styles.body}>Target: one fix per second. Android may deliver fixes in batches. Pause stops GPS collection; resumed sections stay separate.</Text>
  {displayed?.status==='finished' && <ActivityUpload key={displayed.id} activity={displayed} onUploaded={receipt=>{if(receipt.encounters)encounterWorld.acceptRecap(receipt.encounters);void encounterWorld.refresh();}}/>}
  <Text style={styles.heading}>Recent saved activities</Text>
  {history.filter(a=>a.status==='finished').map(a=><Pressable key={a.id} disabled={busy || !!activity} style={styles.card} onPress={()=>void run(async()=>{selectedId.current=a.id;})} accessibilityRole="button"><Text style={styles.metric}>{new Date(a.started).toLocaleString()}</Text><Text style={styles.body}>{activity ? 'Finish recording to review this activity' : 'View route and recap'}</Text></Pressable>)}
  {!history.some(a=>a.status==='finished') && <Text style={styles.body}>Finish your first test to keep its recording here.</Text>}
 </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({
 idleBottom:{backgroundColor:'transparent',padding:0,alignItems:'center'},
 smallLabel:{color:'#eef8ef',fontSize:14,fontWeight:'600'},gameTop:{position:'absolute',top:8,left:12,right:12},gamePanel:{backgroundColor:'#10271fee',borderRadius:16,paddingHorizontal:12,paddingVertical:6,gap:4},gameRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12},gameTitle:{color:'#eef8ef',fontSize:21,fontWeight:'800'},gameMenu:{padding:10,backgroundColor:'#284c3a',borderRadius:12},gameBottom:{position:'absolute',bottom:12,left:12,right:12,backgroundColor:'#10271ff2',padding:16,borderRadius:20,gap:8},gameScore:{color:'#bca0ff',fontSize:28,fontWeight:'800'},

 screen:{flex:1,backgroundColor:'#10271f'},content:{padding:24,gap:18,width:'100%',maxWidth:700,alignSelf:'center'},title:{color:'#eef8ef',fontSize:34,fontWeight:'700'},subtitle:{color:'#b5e1c4',fontSize:20},heading:{color:'#eef8ef',fontSize:21,fontWeight:'600'},body:{color:'#a8c6b5',fontSize:15,lineHeight:22},card:{backgroundColor:'#1c3a2e',padding:20,borderRadius:18,gap:12},historyCard:{backgroundColor:'#1c3a2e',padding:14,borderRadius:18,gap:10,borderWidth:1,borderColor:'#355943'},historyHeading:{flexDirection:'row',alignItems:'center',gap:10},historyScore:{minWidth:70,alignItems:'center',paddingHorizontal:10,paddingVertical:7,borderRadius:12,backgroundColor:'#3d285f'},historyPoints:{color:'#c8a7ff',fontSize:23,fontWeight:'800'},recapScore:{position:'absolute',top:12,right:12,minWidth:145,maxWidth:'58%',padding:12,borderRadius:15,backgroundColor:'#10271fee',gap:3},recapPoints:{color:'#c8a7ff',fontSize:27,fontWeight:'800'},pendingPoints:{color:'#f2c27c',fontSize:14,fontWeight:'700'},recapActions:{position:'absolute',bottom:12,left:12,right:12,flexDirection:'row',gap:10},recapButton:{flex:1,alignItems:'center',backgroundColor:'#9be9b4',padding:15,borderRadius:14},recapButtonSecondary:{alignItems:'center',justifyContent:'center',backgroundColor:'#10271fee',paddingHorizontal:15,borderRadius:14},state:{color:'#8ce8ac',fontWeight:'700',letterSpacing:2},distance:{color:'#eef8ef',fontSize:42,fontWeight:'600'},metric:{color:'#e6f2ea',fontSize:16},actions:{flexDirection:'row',flexWrap:'wrap',gap:12},button:{backgroundColor:'#9be9b4',paddingHorizontal:22,paddingVertical:16,borderRadius:12},buttonText:{color:'#10271f',fontSize:17,fontWeight:'700'},secondary:{padding:16,borderRadius:12,backgroundColor:'#284c3a'},secondaryText:{color:'#e6f2ea',fontSize:16,fontWeight:'600'}
});
