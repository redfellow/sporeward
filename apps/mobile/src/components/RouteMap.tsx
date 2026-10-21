import {RicherMapImages} from './RicherMapImages';
import * as Location from 'expo-location';
import {outbreakAppearance} from './outbreak-appearance';
import {RicherOverlay,growthPoint,type MapViewport,type GrowthCamera} from './RicherOverlay';
import {gameMapStyle} from './map-theme';
import {useSharedValue} from 'react-native-reanimated';
import {MapControlIcon} from './MapControlIcon';
import {CleanupFeedback} from './CleanupFeedback';
import {MapAttribution} from './MapAttribution';
import {travelHeading} from '../recording/heading';
import type {WorldView} from '@sporeward/protocol';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Map as NativeMap, Camera, type CameraRef, type MapRef, GeoJSONSource, Layer, type StyleSpecification } from '@maplibre/maplibre-react-native';
import { type Fix, routeGeometry } from '../recording/model';
const OFFLINE_STYLE: StyleSpecification = {version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#152e26'}}]};
export function RouteMap({brightMap=false,fixes, activityId,world,visited,recording,fullscreen=false,bottomInset=280,topInset=160}:{brightMap?:boolean;fixes:Fix[];activityId:string | null;world:WorldView|null;visited:Set<string>;recording:boolean;fullscreen?:boolean;bottomInset?:number;topInset?:number}) {
 const [controlsHeight,setControlsHeight]=useState(80);
 const [viewport,setViewport]=useState<MapViewport>({center:[23.761,61.498],bounds:[23.68,61.46,23.84,61.54],zoom:12});
 const mapStyle=useMemo(()=>gameMapStyle(brightMap),[brightMap]);
 const cameraRevision=useRef(0);
 const nativeMap=useRef<MapRef>(null),dimensions=useRef({width:0,height:0}),anchor=useRef<[number,number]>([0,0]);
 const visualCamera=useSharedValue<GrowthCamera>({center:[23.761,61.498],zoom:12,bearing:0,width:0,height:0,anchor:[0,0]});
 const alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 // Calibrate only while settled; camera events drive every movement directly.
 const calibrateProjection=()=>{
  const map=nativeMap.current;if(!map)return;
  const revision=cameraRevision.current,current=visualCamera.value;
  const east:[number,number]=[current.center[0]+.001,current.center[1]];
  void Promise.all([map.project(current.center),map.project(east)]).then(([o,e])=>{
   if(!alive.current||cameraRevision.current!==revision)return;
   const distance=growthPoint(east)[0]-growthPoint(current.center)[0];
   const scale=Math.hypot(e[0]-o[0],e[1]-o[1])/distance;
   const expected=512*2**current.zoom/(2*Math.PI*6378137*Math.cos(61.495*Math.PI/180));
   if(!Number.isFinite(scale)||scale<=0)return;
   anchor.current=o;visualCamera.value={...visualCamera.value,anchor:o,scaleFactor:scale/expected};
  }).catch(()=>{});
 };
 const syncCamera=(v:{center:[number,number];zoom:number;bearing:number})=>{cameraRevision.current++;visualCamera.value={...visualCamera.value,...v,...dimensions.current,anchor:anchor.current};};
 const [selected,setSelected]=useState<string|null>(null);
 const selectedOutbreak=world?.outbreaks.find(o=>o.id===selected);
 const camera=useRef<CameraRef>(null), fitted=useRef<string|null>(null);
 const [offline,setOffline]=useState(false),[ready,setReady]=useState(false),[follow,setFollow]=useState(true);
 const [panned,setPanned]=useState(false);
 const [idlePosition,setIdlePosition]=useState<[number,number]|null>(null),idleCentered=useRef(false);
 useEffect(()=>{let alive=true;void(async()=>{if((await Location.getForegroundPermissionsAsync()).status!=='granted')return;const position=await Location.getLastKnownPositionAsync();if(alive&&position)setIdlePosition([position.coords.longitude,position.coords.latitude]);})().catch(()=>{});return()=>{alive=false;};},[]);
 const [orientation,setOrientation]=useState<'north'|'travel'>('north');
 const heading=useRef(0),viewCenter=useRef<[number,number]>([23.761,61.498]);
 const followedActivity=useRef<string|null>(null),latest=fixes.at(-1);
 useEffect(()=> {
  if(offline || ready) return;
  const timer=setTimeout(()=>setOffline(true),10000);
  return ()=>clearTimeout(timer);
 },[offline,ready]);
 useEffect(()=>{setFollow(recording);followedActivity.current=null;},[activityId]);
 useEffect(()=>{if(ready&&!activityId&&idlePosition&&!idleCentered.current&&!panned){idleCentered.current=true;camera.current?.easeTo({center:idlePosition,zoom:14,duration:300});}},[ready,activityId,idlePosition,panned]);
 const route=useMemo(()=>routeGeometry(fixes),[fixes]);
 // Bound native tessellation to nearby geometry; retain the complete world for gameplay.
 const visibleOutbreaks=useMemo(()=>{
  const [west,south,east,north]=viewport.bounds,dx=east-west,dy=north-south;
  return (world?.outbreaks??[]).filter(o=>{const xs=o.ring.map(p=>p[0]),ys=o.ring.map(p=>p[1]);return Math.max(...xs)>=west-dx&&Math.min(...xs)<=east+dx&&Math.max(...ys)>=south-dy&&Math.min(...ys)<=north+dy;});
 },[world,viewport]);
 const outbreaks=useMemo(()=>({type:'FeatureCollection' as const,features:visibleOutbreaks.map(o=>({type:'Feature' as const,properties:{...outbreakAppearance(o),id:o.id,difficultyColor:o.visitsRemaining<=1?'#f5c65c':o.visitsRemaining<=3?'#f49b35':o.visitsRemaining<=5?'#e76728':'#bd3829',visited:visited.has(o.id),unavailable:o.status==='cleared'&&o.clearedAt!==null&&Date.now()>o.clearedAt+600000||o.eligibleAt>Date.now(),withering:o.status==='withering',clearing:o.status==='clearing',disintegrating:o.lifecycle==='disintegrating',remnant:o.lifecycle==='remnant',intensity:o.status==='cleared'?.12:o.lifecycle==='remnant'?.03+.25*Math.min(1,o.strength/.25):.28},geometry:{type:'Polygon' as const,coordinates:[[...o.ring,o.ring[0]]]}}))}),[visibleOutbreaks,visited]);

 const labelFor=(o:WorldView['outbreaks'][number])=>o.status==='cleared'||o.status==='clearing'||o.lifecycle==='stabilizing'?'':o.lifecycle==='remnant'?`+${o.cleanupBonus}`:`${o.visitsRemaining}`;
 const labels=useMemo(()=>({type:'FeatureCollection' as const,features:visibleOutbreaks.map(o=>({type:'Feature' as const,properties:{label:labelFor(o)},geometry:{type:'Point' as const,coordinates:[o.ring.reduce((n,p)=>n+p[0],0)/o.ring.length,o.ring.reduce((n,p)=>n+p[1],0)/o.ring.length]}}))}),[visibleOutbreaks,visited]);
 const fit = () => {setFollow(false);if(route.bounds) camera.current?.fitBounds(route.bounds,{padding:fullscreen?{top:topInset+20,right:32,bottom:bottomInset+controlsHeight+50,left:32}:{top:32,right:32,bottom:32,left:32},duration:300});};
 useEffect(()=> {if(ready && activityId && route.bounds && fitted.current!==activityId && !recording) {fit();fitted.current=activityId;}},[ready,activityId,route.bounds,recording]);
 useEffect(()=>{if(ready&&recording&&follow&&latest){const first=followedActivity.current!==activityId;const direction=travelHeading(fixes);if(direction!==null)heading.current=direction;camera.current?.easeTo({bearing:orientation==='north'?0:heading.current,padding:fullscreen?{top:topInset,bottom:bottomInset+controlsHeight+40,left:24,right:24}:undefined,center:[latest.longitude,latest.latitude],duration:300,...(first?{zoom:15}:{})});followedActivity.current=activityId;}},[ready,recording,follow,orientation,latest?.timestamp,activityId,fullscreen,bottomInset,topInset,controlsHeight]);
 return <View style={[styles.section,fullscreen&&{flex:1}]}>
  <View style={[styles.map,fullscreen&&{flex:1,height:undefined,borderRadius:0}]}><NativeMap ref={nativeMap} touchPitch={false} onLayout={e=>{dimensions.current=e.nativeEvent.layout;anchor.current=[dimensions.current.width/2,dimensions.current.height/2];visualCamera.value={...visualCamera.value,...dimensions.current,anchor:anchor.current};}} style={StyleSheet.absoluteFill} mapStyle={offline ? OFFLINE_STYLE : mapStyle}
   onDidFinishLoadingStyle={()=>{setReady(true);}} onDidFailLoadingMap={()=> {setOffline(true);setReady(false);}}
   onRegionDidChange={event=>{const v=event.nativeEvent;viewCenter.current=v.center;setViewport({center:v.center,bounds:v.bounds,zoom:v.zoom});}}
   onRegionWillChange={event=>{if(event.nativeEvent.userInteraction){setFollow(false);setPanned(true);}}} attribution={false} logo={false}>
   <Camera ref={camera} initialViewState={{center:[23.761,61.498],zoom:12}} maxZoom={19}/>
   <GeoJSONSource key="outbreaks" id="outbreaks" data={outbreaks} onPress={event=>{const id=event.nativeEvent.features[0]?.properties?.id;if(typeof id==='string')setSelected(id);event.stopPropagation();}}>
    <Layer key="outbreak-fill" id="outbreak-fill" type="fill" paint={{'fill-color':['get','bodyColor'],'fill-opacity':['get','intensity']}}/>
    {<Layer key="native-richer-halo" id="native-richer-halo" type="line" paint={{'line-color':['get','bodyColor'],'line-opacity':.09,'line-width':['interpolate',['exponential',2],['zoom'],10,.33,14,5.26,18,84.16]}}/>}
    {<Layer key="native-richer-glow" id="native-richer-glow" type="line" paint={{'line-color':['get','bodyColor'],'line-opacity':.18,'line-width':['interpolate',['exponential',2],['zoom'],10,.14,14,2.2,18,35.2]}}/>}
    {<Layer key="native-richer-rim" id="native-richer-rim" type="line" paint={{'line-color':['get','rimColor'],'line-opacity':.8,'line-width':['interpolate',['exponential',2],['zoom'],10,.05,14,.8,18,12.8]}}/>}
    {<Layer key="native-richer-withering" id="native-richer-withering" type="line" filter={['==',['get','withering'],true]} paint={{'line-color':'#fff2cf','line-opacity':.8,'line-dasharray':[1,5],'line-width':['interpolate',['exponential',2],['zoom'],10,.08,14,1.3,18,20.8]}}/>}
    {<Layer key="native-richer-visited" id="native-richer-visited" type="line" filter={['==',['get','visited'],true]} paint={{'line-color':'#30ddc7','line-opacity':.8,'line-dasharray':[5,2],'line-width':['interpolate',['exponential',2],['zoom'],10,.08,14,1.3,18,20.8]}}/>}
   </GeoJSONSource>
   {<RicherMapImages world={world} viewport={viewport}/>}
   <GeoJSONSource key="outbreak-labels" id="outbreak-labels" data={labels}>
    <Layer key="outbreak-label" id="outbreak-label" type="symbol" minzoom={17} layout={{'text-field':['get','label'],'text-font':['Noto Sans Regular'],'text-size':11}} paint={{'text-color':'#231333','text-halo-color':'#ffffff','text-halo-width':1}}/>
   </GeoJSONSource>
   <GeoJSONSource key="recorded-route" id="recorded-route" data={route.lines}>
    <Layer key="route-outline" id="route-outline" type="line" filter={['==',['get','kind'],'recorded']} paint={{'line-color':'#ffffff','line-width':7}}/>
    <Layer key="route-line" id="route-line" type="line" filter={['==',['get','kind'],'recorded']} paint={{'line-color':'#e42fa5','line-width':4}} layout={{'line-join':'round','line-cap':'round'}}/>
    <Layer key="route-gap" id="route-gap" type="line" filter={['==',['get','kind'],'gap']} paint={{'line-color':'#eb6bad','line-width':3,'line-dasharray':[2,2]}}/>
   </GeoJSONSource>
   <GeoJSONSource key="route-markers" id="route-markers" data={route.markers}>
    <Layer key="route-points" id="route-points" type="circle" paint={{'circle-radius':6,'circle-color':['match',['get','role'],'start','#ffffff','#e42fa5'],'circle-stroke-color':'#10271f','circle-stroke-width':2}}/>
   </GeoJSONSource>
  </NativeMap></View>
  {fullscreen&&<CleanupFeedback world={world} top={topInset+8} hidden={!!selectedOutbreak}/>}
  {selectedOutbreak && <View style={[styles.detail,fullscreen&&{position:'absolute',top:topInset+8,left:12,right:12}]}>
   <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text style={styles.detailTitle}>{selectedOutbreak.name}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close outbreak details" onPress={()=>setSelected(null)} style={styles.button}><Text style={styles.label}>Close</Text></Pressable></View>
   <Text style={styles.label}>{visited.has(selectedOutbreak.id)?'Visited during this outing':selectedOutbreak.eligibleAt>Date.now()?'Revisit available '+new Date(selectedOutbreak.eligibleAt).toLocaleTimeString():selectedOutbreak.status==='cleared'?'Cleared':'Available'} · {selectedOutbreak.status}</Text>
   <Text style={styles.label}>{selectedOutbreak.lifecycle==='remnant'?`${selectedOutbreak.cleanupBonus} cleanup points · one touch clears this remnant`:`${selectedOutbreak.visitPoints} visit points + ${selectedOutbreak.cleanupBonus} cleanup bonus`}</Text>
   {!!selectedOutbreak.phaseEndsAt&&<Text style={styles.label}>{selectedOutbreak.lifecycle==='disintegrating'?'Disintegrates':selectedOutbreak.lifecycle==='remnant'?'Expires':'Ready'} {new Date(selectedOutbreak.phaseEndsAt).toLocaleString()}</Text>}
   <Text style={styles.legend}>{selectedOutbreak.status==='clearing'?'Clearing · committed cleaning is enough':`~${selectedOutbreak.visitsRemaining} visits remaining after committed cleaning`}</Text>
   {selectedOutbreak.lifecycle==='ordinary'&&['active','withering'].includes(selectedOutbreak.status)&&<Text style={styles.legend}>Gold needs fewer visits; orange and red need more.</Text>}
  </View>}
  {!fullscreen && <><Text style={styles.legend}>Gold → orange → red: fewer → more visits after committed cleaning · Gray: unavailable · Turquoise outline: touched during this activity · Pale mint: clearing.</Text>
  <Text style={styles.legend}>Magenta: recorded route · Pink dashes: GPS gaps over 2 s. Paused sections stay separate.</Text>
  {offline && <Text style={styles.legend}>Route-only view. Basemap unavailable; recording still works.</Text>}
  {!fixes.length && <Text style={styles.legend}>Tampere shown until your first GPS fix arrives.</Text>}
  </>}
  <View onLayout={event=>setControlsHeight(Math.ceil(event.nativeEvent.layout.height))} style={[styles.actions,fullscreen&&{position:'absolute',bottom:bottomInset+18,right:16}]}>
   <Pressable accessibilityRole="button" accessibilityLabel={orientation==='north'?'North up. Switch to track up':'Track up. Switch to north up'} onPress={()=>{const next=orientation==='north'?'travel':'north';setOrientation(next);camera.current?.easeTo({center:viewCenter.current,bearing:next==='north'?0:heading.current,duration:250});}} style={styles.mapControl}><MapControlIcon kind={orientation}/>{orientation==='north'&&<Text style={styles.north}>N</Text>}</Pressable>
   {panned&&<Pressable accessibilityRole="button" accessibilityLabel="Center map on your position" onPress={()=>{setPanned(false);setFollow(true);followedActivity.current=null;camera.current?.easeTo({center:latest?[latest.longitude,latest.latitude]:idlePosition??viewCenter.current,bearing:orientation==='north'?0:heading.current,duration:300});}} style={styles.mapControl}><MapControlIcon kind="center"/><Text style={styles.centerLabel}>CENTER</Text></Pressable>}
  </View>
  {!fullscreen&&<MapAttribution/>}
 </View>;
}
const styles=StyleSheet.create({mapControl:{width:52,height:52,borderRadius:26,backgroundColor:'#17392ef2',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#a7c7b766'},north:{position:'absolute',top:1,fontSize:8,includeFontPadding:false,fontWeight:'800',color:'#eff8ef'},centerLabel:{includeFontPadding:false,textAlign:'center',fontSize:7,fontWeight:'800',letterSpacing:.4,color:'#eff8ef'},detail:{padding:14,borderRadius:18,backgroundColor:'#10271ff2',gap:8},detailTitle:{color:'#eef8ef',fontSize:20,fontWeight:'700'},section:{gap:10},map:{height:320,borderRadius:16,overflow:'hidden',backgroundColor:'#152e26'},legend:{color:'#a8c6b5',fontSize:14,lineHeight:20},actions:{flexDirection:'row',gap:12,flexWrap:'wrap'},button:{padding:12,borderRadius:10,backgroundColor:'#284c3a'},label:{color:'#e6f2ea',fontWeight:'600'}});
