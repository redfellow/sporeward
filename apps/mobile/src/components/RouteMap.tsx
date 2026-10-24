import {AreaSummaryLayer} from './AreaSummaryLayer';
import {outbreakGeometry} from './outbreak-geometry';
import {SERVER_URL} from '../server/client';
import {FieldLabLayers} from './FieldLabLayers';
import {ResistanceLayer} from './ResistanceLayer';
import {matchContacts} from '@sporeward/game';
import {RicherMapImages} from './RicherMapImages';
import * as Location from 'expo-location';
import {outbreakAppearance} from './outbreak-appearance';
import type {MapViewport} from './RicherOverlay';
import {gameMapStyle} from './map-theme';
import {MapControlIcon} from './MapControlIcon';
import {CleanupFeedback} from './CleanupFeedback';
import {MapAttribution} from './MapAttribution';
import {DestinationCard} from './DestinationCard';
import {NearbyDestinationsSheet} from './NearbyDestinationsSheet';
import {nearbyTargetExists} from './nearby-destinations';
import {destinationSummary,type DestinationFocus,type DestinationLocation} from './destination-focus';
import {travelHeading} from '../recording/heading';
import type {ActivityFootprint,WorldView,FieldLabOffer,EncounterRecap} from '@sporeward/protocol';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, BackHandler, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Map as NativeMap, Camera, type CameraRef, GeoJSONSource, Layer, type StyleSpecification } from '@maplibre/maplibre-react-native';
import { type Fix, routeGeometry } from '../recording/model';
import { overviewBounds as worldOverviewBounds } from './map-preparation';
const OFFLINE_STYLE: StyleSpecification = {version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#152e26'}}]};
type RouteMapProps={brightMap?:boolean;labOffer?:FieldLabOffer|null;labRecap?:EncounterRecap|null;fixes:Fix[];activityId:string|null;world:WorldView|null;visited:Set<string>;recording:boolean;fullscreen?:boolean;historicalOnly?:boolean;historicalFootprints?:ActivityFootprint[];bottomInset?:number;topInset?:number;destination?:DestinationFocus|null;destinationActivityId?:string|null;destinationResetKey?:number;worldStatus?:string;onDestinationChange?:(focus:DestinationFocus|null)=>void;onRenderTestClock?:(action:'pause'|'resume'|'advance'|'reset',minutes?:number)=>Promise<void>};
export function RouteMap({brightMap=false,labOffer=null,labRecap=null,fixes,activityId,world,visited:recordedVisited,recording,fullscreen=false,historicalOnly=false,historicalFootprints=[],bottomInset=280,topInset=160,destination=null,destinationActivityId=null,destinationResetKey=0,worldStatus='',onDestinationChange,onRenderTestClock}:RouteMapProps) {
 const destinationMode=!!onDestinationChange&&!historicalOnly;
 const window=useWindowDimensions();
 const [mapHeight,setMapHeight]=useState(window.height),[targetCardHeight,setTargetCardHeight]=useState(200),[detailsHeight,setDetailsHeight]=useState(240);
 const [nearbyOpen,setNearbyOpen]=useState(false);
 const [distanceClock,setDistanceClock]=useState(Date.now);
 const closeNearby=useCallback(()=>setNearbyOpen(false),[]);
 useEffect(()=>{setNearbyOpen(false);setSelected(null);setSelectedLabId(null);},[destinationResetKey]);
 const nearbyWorld=useRef<number|undefined>(world?.worldStartedAt);
 useEffect(()=>{
  if(nearbyWorld.current!==undefined&&world?.worldStartedAt!==nearbyWorld.current)setNearbyOpen(false);
  nearbyWorld.current=world?.worldStartedAt;
 },[world?.worldStartedAt]);
 useEffect(()=>{
  if(!nearbyOpen)return;
  const sub=BackHandler.addEventListener('hardwareBackPress',()=>{setNearbyOpen(false);return true;});
  return()=>sub.remove();
 },[nearbyOpen]);
 useEffect(()=>{
  if(!destinationMode||(!destination&&!nearbyOpen))return;
  const tick=()=>{if(AppState.currentState==='active')setDistanceClock(Date.now());};
  tick();const timer=setInterval(tick,10000),sub=AppState.addEventListener('change',tick);
  return()=>{clearInterval(timer);sub.remove();};
 },[destinationMode,destination?.id,destination?.kind,nearbyOpen]);
 const renderTest=typeof __DEV__!=='undefined'&&__DEV__&&SERVER_URL.startsWith('http://127.0.0.1:')?world?.renderTest:undefined;
 const visited=useMemo(()=>new Set([...recordedVisited,...(renderTest?.examples.filter(e=>e.visited).flatMap(e=>e.ids)??[])]),[recordedVisited,renderTest]);
 const [exampleIndex,setExampleIndex]=useState(0);
 const [clockBusy,setClockBusy]=useState(false);
 const [controlsHeight,setControlsHeight]=useState(80);
 const [overviewZoom,setOverviewZoom]=useState(11.5);
 const awaitingOverview=useRef(false);
 const [viewport,setViewport]=useState<MapViewport>({center:[23.761,61.498],bounds:[23.68,61.46,23.84,61.54],zoom:12});
 const [materialViewport,setMaterialViewport]=useState(viewport);
 const lastPreparationUpdate=useRef(0);
 const mapStyle=useMemo(()=>gameMapStyle(brightMap),[brightMap]);
 const [selected,setSelected]=useState<string|null>(null);
 const [selectedLabId,setSelectedLabId]=useState<string|null>(null);
 const selectedLab=world?.fieldLabs?.find(lab=>lab.id===selectedLabId);
 const selectedOffer=labOffer?.labs.find(lab=>lab.labId===selectedLabId);
 const selectedResult=labRecap?.labCollections?.find(lab=>lab.labId===selectedLabId);
 const provisionalLabs=useMemo(()=>new Set(matchContacts(fixes,(world?.fieldLabs??[]).filter(lab=>!lab.collected).map(lab=>({id:lab.id,ring:lab.ring,validFrom:lab.spawnedAt,validUntil:lab.expiresAt}))).map(contact=>contact.outbreakId)),[fixes,world]);
 const selectedOutbreak=world?.outbreaks.find(o=>o.id===selected);
 const camera=useRef<CameraRef>(null), fitted=useRef<string|null>(null);
 const [offline,setOffline]=useState(false),[ready,setReady]=useState(false),[follow,setFollow]=useState(true);
 const [panned,setPanned]=useState(false);
 const [idleLocation,setIdleLocation]=useState<DestinationLocation|null>(null),idleCentered=useRef(false);
 const idlePosition=idleLocation?.coordinate??null;
 useEffect(()=>{let alive=true;void(async()=>{if((await Location.getForegroundPermissionsAsync()).status!=='granted')return;const position=await Location.getLastKnownPositionAsync();if(alive&&position)setIdleLocation({coordinate:[position.coords.longitude,position.coords.latitude],timestamp:position.timestamp});})().catch(()=>{});return()=>{alive=false;};},[]);
 const [orientation,setOrientation]=useState<'north'|'travel'>('north');
 const cameraZoom=useRef(12);
 const heading=useRef(0),viewCenter=useRef<[number,number]>([23.761,61.498]);
 const followedActivity=useRef<string|null>(null),latest=fixes.at(-1);
 const location=useMemo<DestinationLocation|null>(()=>latest&&latest.timestamp>=(idleLocation?.timestamp??0)?{coordinate:[latest.longitude,latest.latitude],timestamp:latest.timestamp}:idleLocation,[latest,idleLocation]);
 const currentOuting=destinationActivityId===activityId?destinationActivityId:null;
 const context=useMemo(()=>({world,location,now:Date.now(),outingId:currentOuting,visited:currentOuting?recordedVisited:undefined,provisionalLabs:currentOuting?provisionalLabs:undefined,offer:labOffer,recap:labRecap}),[world,location,currentOuting,recordedVisited,provisionalLabs,labOffer,labRecap,distanceClock]);
 const openNearby=()=>{setSelected(null);setSelectedLabId(null);setDistanceClock(Date.now());setNearbyOpen(true);};
 const selectOutbreak=useCallback((id:string)=>{setNearbyOpen(false);setSelected(id);setSelectedLabId(null);},[]);
 const selectLab=useCallback((id:string)=>{setNearbyOpen(false);setSelectedLabId(id);setSelected(null);},[]);
 const openNearbyDetails=useCallback((focus:DestinationFocus)=>{
  setNearbyOpen(false);
  if(!nearbyTargetExists(focus,world)){Alert.alert('Destination unavailable','This destination is no longer available in the received world. Your pinned destination is unchanged.');return;}
  if(focus.kind==='lab')selectLab(focus.id);else selectOutbreak(focus.id);
 },[world,selectLab,selectOutbreak]);
 const targetSummary=destinationMode?destinationSummary({...context,focus:destination}):null;
 const selectedSummary=destinationMode?destinationSummary({...context,focus:selectedLab?{kind:'lab',id:selectedLab.id}:selectedOutbreak?{kind:'outbreak',id:selectedOutbreak.id}:null}):null;
 const cardTop=topInset+(destinationMode?64:8),cardMaxHeight=Math.max(96,mapHeight-bottomInset-controlsHeight-cardTop-32);
 const detailPlacement=fullscreen?{position:'absolute' as const,top:cardTop,left:12,right:12,maxHeight:cardMaxHeight}:undefined;
 const focusGeometry=useMemo(()=>({type:'FeatureCollection' as const,features:targetSummary?.ring?[{type:'Feature' as const,properties:{},geometry:{type:'Polygon' as const,coordinates:[[...targetSummary.ring,targetSummary.ring[0]]]}}]:[]}),[targetSummary?.ring]);
 useEffect(()=> {
  if(offline || ready) return;
  const timer=setTimeout(()=>setOffline(true),10000);
  return ()=>clearTimeout(timer);
 },[offline,ready]);
 useEffect(()=>{setFollow(recording);followedActivity.current=null;},[activityId]);
 useEffect(()=>{if(ready&&!activityId&&idlePosition&&!idleCentered.current&&!panned){idleCentered.current=true;camera.current?.easeTo({center:idlePosition,zoom:14,duration:300});}},[ready,activityId,idlePosition,panned]);
 const route=useMemo(()=>routeGeometry(fixes),[fixes]);
 const overviewBounds=useMemo(()=>worldOverviewBounds(world,route.bounds),[world,route.bounds]);
 const explore=()=>{setFollow(false);setPanned(true);idleCentered.current=true;};
 const showDestination=(ring:WorldView['outbreaks'][number]['ring'],panelHeight:number)=>{
  if(!ring.length)return;explore();
  const bounds=ring.reduce<[number,number,number,number]>(([w,s,e,n],[x,y])=>[Math.min(w,x),Math.min(s,y),Math.max(e,x),Math.max(n,y)],[ring[0][0],ring[0][1],ring[0][0],ring[0][1]]);
  camera.current?.fitBounds(bounds,{padding:{top:Math.max(20,Math.min(cardTop+panelHeight+16,mapHeight-bottomInset-controlsHeight-48)),left:36,right:36,bottom:bottomInset+controlsHeight+24},bearing:orientation==='north'?0:heading.current,duration:350});
 };
 const pinDestination=(focus:DestinationFocus)=>{onDestinationChange?.(focus);setSelected(null);setSelectedLabId(null);};
 const controlClock=async(action:'pause'|'resume'|'advance'|'reset',minutes?:number)=>{
  if(!onRenderTestClock||clockBusy)return;setClockBusy(true);
  try{if(action==='reset')onDestinationChange?.(null);await onRenderTestClock(action,minutes);}catch{}finally{setClockBusy(false);}
 };
 const changeZoom=(step:number)=>{
  explore();cameraZoom.current=Math.max(3,Math.min(19,cameraZoom.current+step));
  camera.current?.easeTo({center:viewCenter.current,zoom:cameraZoom.current,duration:200});
 };
 const overview=()=>{
  if(!overviewBounds)return;explore();awaitingOverview.current=true;
  camera.current?.fitBounds(overviewBounds,{padding:fullscreen?{top:topInset+24,right:40,bottom:bottomInset+controlsHeight+40,left:40}:{top:32,right:32,bottom:controlsHeight+32,left:32},bearing:0,duration:350});
 };
 // Bound native tessellation to nearby geometry; retain the complete world for gameplay.
 const visibleOutbreaks=useMemo(()=>{
  if(historicalOnly)return [];
  const [west,south,east,north]=viewport.bounds,dx=east-west,dy=north-south;
  return (world?.outbreaks??[]).filter(o=>{const xs=o.ring.map(p=>p[0]),ys=o.ring.map(p=>p[1]);return Math.max(...xs)>=west-dx&&Math.min(...xs)<=east+dx&&Math.max(...ys)>=south-dy&&Math.min(...ys)<=north+dy;});
 },[world,viewport,historicalOnly]);
 const visualRings=(o:WorldView['outbreaks'][number])=>outbreakGeometry(o,world).rings.map(ring=>[[...ring,ring[0]]]);
 const outbreaks=useMemo(()=>({type:'FeatureCollection' as const,features:viewport.zoom<12?[]:visibleOutbreaks.flatMap(o=>{
  const shape=outbreakGeometry(o,world),strokeScale=shape.special?shape.materialRadius/77:1;
  return visualRings(o).map((polygon,index)=>({type:'Feature' as const,properties:{...outbreakAppearance(o,world!.serverTime),id:o.id,strokeScale,satellite:index>0&&o.lifecycle==='remnant',
   visited:visited.has(o.id),withering:o.status==='withering',remnant:o.lifecycle==='remnant',
   intensity:index>0&&o.lifecycle==='remnant'?.53:o.lifecycle==='stabilizing'?.14:o.status==='clearing'||o.status==='cleared'?.12:o.eligibleAt>world!.serverTime?.16:.28},geometry:{type:'Polygon' as const,coordinates:polygon}}));
 })}),[visibleOutbreaks,visited,world,viewport.zoom]);
 const historic=useMemo(()=>({type:'FeatureCollection' as const,features:historicalFootprints.map((item,index)=>({type:'Feature' as const,properties:{id:item.outbreakId,index},geometry:{type:'Polygon' as const,coordinates:[[...item.ring,item.ring[0]]]}}))}),[historicalFootprints]);

 const labelFor=(o:WorldView['outbreaks'][number])=>renderTest?o.name:o.status==='cleared'||o.status==='clearing'||o.lifecycle==='stabilizing'?'':o.lifecycle==='remnant'?`+${o.cleanupBonus}`:`${o.visitsRemaining}`;
 const labels=useMemo(()=>({type:'FeatureCollection' as const,features:viewport.zoom<14?[]:visibleOutbreaks.map(o=>({type:'Feature' as const,properties:{label:labelFor(o)},geometry:{type:'Point' as const,coordinates:[...outbreakGeometry(o,world).anchor]}}))}),[visibleOutbreaks,visited,renderTest,viewport.zoom]);
 const fit = () => {setFollow(false);if(route.bounds) camera.current?.fitBounds(route.bounds,{padding:fullscreen?{top:topInset+20,right:32,bottom:bottomInset+controlsHeight+50,left:32}:{top:32,right:32,bottom:32,left:32},duration:300});};
 useEffect(()=> {if(ready && activityId && route.bounds && fitted.current!==activityId && !recording) {fit();fitted.current=activityId;}},[ready,activityId,route.bounds,recording]);
 useEffect(()=>{if(ready&&recording&&follow&&latest){const first=followedActivity.current!==activityId;const direction=travelHeading(fixes);if(direction!==null)heading.current=direction;camera.current?.easeTo({bearing:orientation==='north'?0:heading.current,padding:fullscreen?{top:topInset,bottom:bottomInset+controlsHeight+40,left:24,right:24}:undefined,center:[latest.longitude,latest.latitude],duration:300,...(first?{zoom:15}:{})});followedActivity.current=activityId;}},[ready,recording,follow,orientation,latest?.timestamp,activityId,fullscreen,bottomInset,topInset,controlsHeight]);
 return <View style={[styles.section,fullscreen&&{flex:1}]} onLayout={event=>setMapHeight(Math.ceil(event.nativeEvent.layout.height))}>
  <View style={[styles.map,fullscreen&&{flex:1,height:undefined,borderRadius:0}]}><NativeMap touchPitch={false} touchZoom doubleTapZoom doubleTapHoldZoom style={StyleSheet.absoluteFill} mapStyle={offline ? OFFLINE_STYLE : mapStyle}
   onDidFinishLoadingStyle={()=>{setReady(true);}} onDidFailLoadingMap={()=> {setOffline(true);setReady(false);}}
   onRegionIsChanging={event=>{const now=Date.now();if(now-lastPreparationUpdate.current<200)return;lastPreparationUpdate.current=now;const v=event.nativeEvent;setMaterialViewport({center:v.center,bounds:v.bounds,zoom:v.zoom});}}
   onRegionDidChange={event=>{const v=event.nativeEvent;setMaterialViewport({center:v.center,bounds:v.bounds,zoom:v.zoom});if(awaitingOverview.current){awaitingOverview.current=false;setOverviewZoom(v.zoom);}viewCenter.current=v.center;cameraZoom.current=v.zoom;setViewport({center:v.center,bounds:v.bounds,zoom:v.zoom});}}
   onRegionWillChange={event=>{if(event.nativeEvent.userInteraction){setFollow(false);setPanned(true);}}} attribution={false} logo={false}>
   <Camera ref={camera} initialViewState={{center:[23.761,61.498],zoom:12}} minZoom={3} maxZoom={19}/>
  {!historicalOnly&&<ResistanceLayer world={world} bright={brightMap} beforeId={mapStyle.layers.find(layer=>layer.type==='line'&&'source-layer' in layer&&layer['source-layer']==='transportation')?.id}/>}
  {historicalOnly&&<GeoJSONSource key={`historical-${activityId??'none'}`} id="historical-outbreaks" data={historic}>
    <Layer id="historical-glow" type="line" paint={{'line-color':'#ff9c35','line-opacity':.18,'line-blur':9,'line-width':18}}/>
    <Layer id="historical-fill" type="fill" paint={{'fill-color':'#f47d2d','fill-opacity':.42}}/>
    <Layer id="historical-rim" type="line" paint={{'line-color':'#ffd18a','line-opacity':.9,'line-width':2.5}}/>
    <Layer id="historical-contact" type="line" paint={{'line-color':'#42e0bd','line-opacity':1,'line-width':4,'line-dasharray':[4,1.5]}}/>
   </GeoJSONSource>}
   <GeoJSONSource key="outbreaks" id="outbreaks" data={outbreaks} onPress={event=>{const id=event.nativeEvent.features[0]?.properties?.id;if(typeof id==='string')selectOutbreak(id);event.stopPropagation();}}>
    <Layer key="outbreak-fill" id="outbreak-fill" minzoom={12} type="fill" paint={{'fill-color':['get','bodyColor'],'fill-opacity':['get','intensity']}}/>
    {<Layer key="native-richer-rim" id="native-richer-rim" minzoom={12} type="line" paint={{'line-color':['get','rimColor'],'line-opacity':.8,'line-width':['interpolate',['exponential',2],['zoom'],10,['*',.05,['get','strokeScale']],14,['*',.8,['get','strokeScale']],18,['*',12.8,['get','strokeScale']]]}}/>}
    {<Layer key="native-richer-withering" id="native-richer-withering" minzoom={12} type="line" filter={['==',['get','withering'],true]} paint={{'line-color':'#8cf0c9','line-opacity':.8,'line-dasharray':[.5,8],'line-width':['interpolate',['exponential',2],['zoom'],10,['*',.08,['get','strokeScale']],14,['*',1.3,['get','strokeScale']],18,['*',20.8,['get','strokeScale']]]}}/>}
    {<Layer key="native-richer-visited" id="native-richer-visited" minzoom={12} type="line" filter={['==',['get','visited'],true]} paint={{'line-color':'#30ddc7','line-opacity':.8,'line-dasharray':[5,2],'line-width':['interpolate',['exponential',2],['zoom'],10,['*',.08,['get','strokeScale']],14,['*',1.3,['get','strokeScale']],18,['*',20.8,['get','strokeScale']]]}}/>}
   </GeoJSONSource>
   {!historicalOnly&&<RicherMapImages world={world} viewport={materialViewport}/>}
   <GeoJSONSource key="outbreak-labels" id="outbreak-labels" data={labels}>
    <Layer key="outbreak-label" id="outbreak-label" type="symbol" minzoom={renderTest?14:17} layout={{'text-field':['get','label'],'text-font':['Noto Sans Regular'],'text-size':11}} paint={{'text-color':'#231333','text-halo-color':'#ffffff','text-halo-width':1}}/>
   </GeoJSONSource>
   {!historicalOnly&&<AreaSummaryLayer world={world} bright={brightMap} visited={visited} overviewZoom={overviewZoom} onExpand={(center,zoom)=>{explore();camera.current?.easeTo({center,zoom,bearing:0,duration:350});}}/>}
   {!historicalOnly&&<FieldLabLayers world={world} viewport={viewport} bright={brightMap} provisional={provisionalLabs} visited={visited} onOutbreakSelect={selectOutbreak} onSelect={selectLab}/>}
   {destinationMode&&<GeoJSONSource id="pinned-destination" data={focusGeometry}>
    <Layer id="pinned-destination-halo" type="line" paint={{'line-color':brightMap?'#574b28':'#ffe8a3','line-width':9,'line-opacity':.25,'line-blur':3}} layout={{'line-join':'round'}}/>
    <Layer id="pinned-destination-outline" type="line" paint={{'line-color':brightMap?'#796433':'#ffe8a3','line-width':2.5,'line-opacity':.95,'line-dasharray':[3,2]}} layout={{'line-join':'round'}}/>
   </GeoJSONSource>}
   <GeoJSONSource key="recorded-route" id="recorded-route" data={route.lines}>
    <Layer key="route-outline" id="route-outline" type="line" filter={['==',['get','kind'],'recorded']} paint={{'line-color':'#ffffff','line-width':7}}/>
    <Layer key="route-line" id="route-line" type="line" filter={['==',['get','kind'],'recorded']} paint={{'line-color':'#e42fa5','line-width':4}} layout={{'line-join':'round','line-cap':'round'}}/>
    <Layer key="route-gap" id="route-gap" type="line" filter={['==',['get','kind'],'gap']} paint={{'line-color':'#eb6bad','line-width':3,'line-dasharray':[2,2]}}/>
   </GeoJSONSource>
   <GeoJSONSource key="route-markers" id="route-markers" data={route.markers}>
    <Layer key="route-points" id="route-points" type="circle" paint={{'circle-radius':6,'circle-color':['match',['get','role'],'start','#ffffff','#e42fa5'],'circle-stroke-color':'#10271f','circle-stroke-width':2}}/>
   </GeoJSONSource>
  </NativeMap></View>
  {destinationMode&&!nearbyOpen&&<Pressable accessibilityRole="button" accessibilityLabel="Open nearby destinations" onPress={openNearby} style={[styles.button,{position:'absolute',top:topInset+12,left:12,minHeight:44,justifyContent:'center'}]}><Text style={styles.label}>Nearby</Text></Pressable>}
  {destinationMode&&nearbyOpen&&<View style={fullscreen?{position:'absolute',top:cardTop,left:12,right:12}:undefined}><NearbyDestinationsSheet context={context} status={worldStatus} height={Math.max(0,mapHeight-bottomInset-cardTop-16)} onClose={closeNearby} onSelect={openNearbyDetails}/></View>}
  {fullscreen&&!historicalOnly&&<CleanupFeedback world={world} top={topInset+8} hidden={nearbyOpen||!!selectedOutbreak||!!selectedLab||!!targetSummary}/>}
  {!nearbyOpen&&targetSummary&&!selectedLab&&!selectedOutbreak&&<View style={detailPlacement}><DestinationCard summary={targetSummary} maxHeight={cardMaxHeight} onHeight={setTargetCardHeight} onClear={()=>onDestinationChange?.(null)} onDetails={()=>{if(targetSummary.focus.kind==='lab'){setSelectedLabId(targetSummary.focus.id);setSelected(null);}else{setSelected(targetSummary.focus.id);setSelectedLabId(null);}}} onShow={()=>{if(targetSummary.ring)showDestination(targetSummary.ring,targetCardHeight);}}/></View>}
  {!nearbyOpen&&selectedLab&&<ScrollView style={[styles.detail,{padding:0,height:Math.min(cardMaxHeight,380)},detailPlacement]} contentContainerStyle={{padding:14,gap:8}} onLayout={event=>setDetailsHeight(Math.ceil(event.nativeEvent.layout.height))} bounces={false}>
   <View style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={styles.detailTitle}>Field Lab</Text><Pressable accessibilityRole="button" accessibilityLabel="Close Field Lab details" onPress={()=>setSelectedLabId(null)} style={styles.button}><Text style={styles.label}>Close</Text></Pressable></View>
   <Text style={styles.label}>{selectedSummary?selectedSummary.status:selectedLab.collected?'✓ Collected by you':provisionalLabs.has(selectedLab.id)?'Contact recorded · collection provisional':'Available to you'}</Text>
   {selectedSummary?.contact&&<Text style={styles.legend}>{selectedSummary.contact}</Text>}
   <Text style={styles.label}>Expires {new Date(selectedLab.expiresAt).toLocaleString()}</Text>
   <Text style={styles.label}>{selectedSummary?selectedSummary.reward??'No reward available now':selectedResult?.status==='confirmed'?`${selectedResult.rewardName} · ${Math.round(selectedResult.actualFraction*100)}% restoration${selectedResult.limited?' · limited by successive collections or remaining resistance':''}`:selectedOffer?`Up to ${Math.round(selectedOffer.fraction*100)}% resistance restoration · outing offer`:'Restoration confirms on upload · no guaranteed offline amount'}</Text>
   {selectedSummary&&<Text style={styles.legend}>{selectedSummary.distance}</Text>}
   {destinationMode&&<Pressable accessibilityRole="button" accessibilityLabel="Pin Field Lab as destination" style={styles.button} onPress={()=>pinDestination({kind:'lab',id:selectedLab.id})}><Text style={styles.label}>{destination?.kind==='lab'&&destination.id===selectedLab.id?'Keep pinned destination':destination?'Replace pinned destination':'Pin destination'}</Text></Pressable>}
   <Pressable accessibilityRole="button" accessibilityLabel="Show Field Lab collection area" style={styles.button} onPress={()=>showDestination(selectedLab.ring,detailsHeight)}><Text style={styles.label}>Show collection area</Text></Pressable>
   <Text style={styles.legend}>Ride through the outlined area while recording to collect. Restoration confirms on upload. Other players collect independently.</Text>
  </ScrollView>}
  {!nearbyOpen&&selectedOutbreak && <ScrollView style={[styles.detail,{padding:0,height:Math.min(cardMaxHeight,380)},detailPlacement]} contentContainerStyle={{padding:14,gap:8}} onLayout={event=>setDetailsHeight(Math.ceil(event.nativeEvent.layout.height))} bounces={false}>
   <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text style={styles.detailTitle}>{selectedOutbreak.name}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close outbreak details" onPress={()=>setSelected(null)} style={styles.button}><Text style={styles.label}>Close</Text></Pressable></View>
   <Text style={styles.label}>{selectedSummary?selectedSummary.status:visited.has(selectedOutbreak.id)?'Visited during this outing':selectedOutbreak.eligibleAt>Date.now()?'Revisit available '+new Date(selectedOutbreak.eligibleAt).toLocaleTimeString():selectedOutbreak.status==='cleared'?'Cleared':'Available'} · {selectedOutbreak.status}</Text>
   {selectedSummary?.availableAt&&<Text style={styles.legend}>Revisit after {new Date(selectedSummary.availableAt).toLocaleTimeString()}</Text>}
   {selectedSummary?.contact&&<Text style={styles.legend}>{selectedSummary.contact}</Text>}
   <Text style={styles.label}>{selectedSummary?selectedSummary.reward??'No visit reward available now':selectedOutbreak.lifecycle==='remnant'?`${selectedOutbreak.cleanupBonus} cleanup points · one touch clears this remnant`:`${selectedOutbreak.visitPoints} visit points + ${selectedOutbreak.cleanupBonus} cleanup bonus`}</Text>
   {!!selectedOutbreak.phaseEndsAt&&<Text style={styles.label}>{selectedOutbreak.lifecycle==='disintegrating'?'Disintegrates':selectedOutbreak.lifecycle==='remnant'?'Expires':'Ready'} {new Date(selectedOutbreak.phaseEndsAt).toLocaleString()}</Text>}
   <Text style={styles.legend}>{selectedOutbreak.status==='clearing'?'Clearing · committed cleaning is enough':`~${selectedOutbreak.visitsRemaining} visits remaining after committed cleaning`}</Text>
   {selectedOutbreak.lifecycle==='ordinary'&&['active','withering'].includes(selectedOutbreak.status)&&<Text style={styles.legend}>Gold needs fewer visits; orange and red need more.</Text>}
   {selectedSummary&&<Text style={styles.legend}>{selectedSummary.distance}</Text>}
   {destinationMode&&<Pressable accessibilityRole="button" accessibilityLabel="Pin outbreak as destination" style={styles.button} onPress={()=>pinDestination({kind:'outbreak',id:selectedOutbreak.id})}><Text style={styles.label}>{destination?.kind==='outbreak'&&destination.id===selectedOutbreak.id?'Keep pinned destination':destination?'Replace pinned destination':'Pin destination'}</Text></Pressable>}
  </ScrollView>}
  {!fullscreen && <><Text style={styles.legend}>Gold → orange → red: fewer → more visits after committed cleaning · Gray: unavailable · Turquoise outline: touched during this activity · Pale mint: clearing.</Text>
  <Text style={styles.legend}>Magenta: recorded route · Pink dashes: GPS gaps over 2 s. Paused sections stay separate.</Text>
  {offline && <Text style={styles.legend}>Route-only view. Basemap unavailable; recording still works.</Text>}
  {!fixes.length && <Text style={styles.legend}>Tampere shown until your first GPS fix arrives.</Text>}
  </>}
  {renderTest&&!nearbyOpen&&!selectedLab&&!selectedOutbreak&&!targetSummary&&<View style={[styles.detail,fullscreen&&{position:'absolute',left:12,top:topInset+8}, {maxWidth:250}]}>
   <Text style={styles.label}>Render test · lifecycle {renderTest.clock?.paused===false?'running':'paused'}</Text>
   <Text style={styles.legend}>{exampleIndex+1}/{renderTest.examples.length} · {renderTest.examples[exampleIndex]?.name}</Text>
   {renderTest.clock&&onRenderTestClock&&<>
    <Text style={styles.legend}>{renderTest.clock.elapsedMinutes}/{renderTest.clock.limitMinutes} min · membrane motion continues while paused</Text>
    <View style={styles.actions}>
     <Pressable disabled={clockBusy} accessibilityRole="button" accessibilityLabel={renderTest.clock.paused?'Resume lifecycle clock':'Pause lifecycle clock'} style={[styles.button,clockBusy&&{opacity:.5}]} onPress={()=>void controlClock(renderTest.clock!.paused?'resume':'pause')}><Text style={styles.label}>{renderTest.clock.paused?'Resume':'Pause'}</Text></Pressable>
     <Pressable disabled={clockBusy||renderTest.clock.elapsedMinutes>=renderTest.clock.limitMinutes} accessibilityRole="button" accessibilityLabel="Advance lifecycle clock five minutes" style={[styles.button,(clockBusy||renderTest.clock.elapsedMinutes>=renderTest.clock.limitMinutes)&&{opacity:.5}]} onPress={()=>void controlClock('advance',5)}><Text style={styles.label}>+5 min</Text></Pressable>
     <Pressable disabled={clockBusy} accessibilityRole="button" accessibilityLabel="Reset render test lifecycle" style={[styles.button,clockBusy&&{opacity:.5}]} onPress={()=>void controlClock('reset')}><Text style={styles.label}>Reset</Text></Pressable>
    </View>
   </>}
   <View style={styles.actions}>{[-1,1].map(step=><Pressable key={step} accessibilityRole="button" accessibilityLabel={step===1?'Next render example':'Previous render example'} style={styles.button} onPress={()=>{
    const index=(exampleIndex+step+renderTest.examples.length)%renderTest.examples.length;setExampleIndex(index);setSelected(null);setSelectedLabId(null);explore();
    const ids=renderTest.examples[index].ids,points=(world?.outbreaks??[]).filter(o=>ids.includes(o.id)).flatMap(o=>o.ring);
    if(points.length)camera.current?.fitBounds([Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))],{padding:{top:topInset+145,right:75,bottom:bottomInset+controlsHeight+40,left:75},bearing:0,duration:300});
   }}><Text style={styles.label}>{step===1?'Next →':'← Previous'}</Text></Pressable>)}</View>
  </View>}
  {!nearbyOpen&&<View onLayout={event=>setControlsHeight(Math.ceil(event.nativeEvent.layout.height))} style={[styles.controlGroup,fullscreen&&{position:'absolute',bottom:bottomInset+18,right:16}]}>
   <View style={styles.actions}>
    <Pressable accessibilityRole="button" accessibilityLabel="Zoom in" onPress={()=>changeZoom(.25)} style={styles.mapControl}><MapControlIcon kind="zoom-in"/></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Zoom out" onPress={()=>changeZoom(-.25)} style={styles.mapControl}><MapControlIcon kind="zoom-out"/></Pressable>
    {!!overviewBounds&&<Pressable accessibilityRole="button" accessibilityLabel="Show labs and resistance overview" onPress={overview} style={styles.mapControl}><MapControlIcon kind="overview"/><Text style={styles.centerLabel}>OVERVIEW</Text></Pressable>}
   </View>
   <View style={styles.actions}>
   <Pressable accessibilityRole="button" accessibilityLabel={orientation==='north'?'North up. Switch to track up':'Track up. Switch to north up'} onPress={()=>{const next=orientation==='north'?'travel':'north';setOrientation(next);camera.current?.easeTo({center:viewCenter.current,bearing:next==='north'?0:heading.current,duration:250});}} style={styles.mapControl}><MapControlIcon kind={orientation}/>{orientation==='north'&&<Text style={styles.north}>N</Text>}</Pressable>
   {panned&&<Pressable accessibilityRole="button" accessibilityLabel="Center map on your position" onPress={()=>{setPanned(false);setFollow(true);followedActivity.current=null;camera.current?.easeTo({center:latest?[latest.longitude,latest.latitude]:idlePosition??viewCenter.current,bearing:orientation==='north'?0:heading.current,duration:300});}} style={styles.mapControl}><MapControlIcon kind="center"/><Text style={styles.centerLabel}>CENTER</Text></Pressable>}
   </View>
  </View>}
  {!fullscreen&&<MapAttribution/>}
 </View>;
}
const styles=StyleSheet.create({controlGroup:{gap:8,alignItems:'flex-end'},mapControl:{width:52,height:52,borderRadius:26,backgroundColor:'#17392ef2',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#a7c7b766'},north:{position:'absolute',top:1,fontSize:8,includeFontPadding:false,fontWeight:'800',color:'#eff8ef'},centerLabel:{includeFontPadding:false,textAlign:'center',fontSize:7,fontWeight:'800',letterSpacing:.4,color:'#eff8ef'},detail:{padding:14,borderRadius:18,backgroundColor:'#10271ff2',gap:8},detailTitle:{color:'#eef8ef',fontSize:20,fontWeight:'700'},section:{gap:10},map:{height:320,borderRadius:16,overflow:'hidden',backgroundColor:'#152e26'},legend:{color:'#a8c6b5',fontSize:14,lineHeight:20},actions:{flexDirection:'row',gap:12,flexWrap:'wrap'},button:{padding:12,borderRadius:10,backgroundColor:'#284c3a'},label:{color:'#e6f2ea',fontWeight:'600'}});
