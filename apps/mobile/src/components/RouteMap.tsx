import {travelHeading} from '../recording/heading';
import type {WorldView} from '@sporeward/protocol';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { Map as NativeMap, Camera, type CameraRef, GeoJSONSource, Layer, type StyleSpecification } from '@maplibre/maplibre-react-native';
import { type Fix, routeGeometry } from '../recording/model';
const BASEMAP = 'https://tiles.openfreemap.org/styles/liberty';
const OFFLINE_STYLE: StyleSpecification = {version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#152e26'}}]};
export function RouteMap({fixes, activityId,world,visited,recording,fullscreen=false,bottomInset=280}:{fixes:Fix[];activityId:string | null;world:WorldView|null;visited:Set<string>;recording:boolean;fullscreen?:boolean;bottomInset?:number}) {
 const [pulse,setPulse]=useState(1);
 useEffect(()=>{let timer:ReturnType<typeof setInterval>|undefined;const resume=()=>{clearInterval(timer);if(fullscreen&&AppState.currentState==='active')timer=setInterval(()=>setPulse(.94+.06*Math.sin(Date.now()/1800)),2500);};resume();const sub=AppState.addEventListener('change',resume);return()=>{clearInterval(timer);sub.remove();};},[fullscreen]);
 const [selected,setSelected]=useState<string|null>(null);
 const selectedOutbreak=world?.outbreaks.find(o=>o.id===selected);
 const camera=useRef<CameraRef>(null), fitted=useRef<string|null>(null);
 const [offline,setOffline]=useState(false),[ready,setReady]=useState(false),[follow,setFollow]=useState(true);
 const [orientation,setOrientation]=useState<'north'|'travel'>('north');
 const heading=useRef(0);
 const followedActivity=useRef<string|null>(null),latest=fixes.at(-1);
 useEffect(()=> {
  if(offline || ready) return;
  const timer=setTimeout(()=>setOffline(true),10000);
  return ()=>clearTimeout(timer);
 },[offline,ready]);
 useEffect(()=>{setFollow(recording);followedActivity.current=null;},[activityId]);
 const route=useMemo(()=>routeGeometry(fixes),[fixes]);
 const outbreaks=useMemo(()=>({type:'FeatureCollection' as const,features:world?.outbreaks.map(o=>({type:'Feature' as const,properties:{id:o.id,visited:visited.has(o.id),unavailable:o.status==='cleared'&&o.clearedAt!==null&&Date.now()>o.clearedAt+600000||o.eligibleAt>Date.now(),clearing:o.status==='clearing',disintegrating:o.lifecycle==='disintegrating',remnant:o.lifecycle==='remnant',intensity:o.status==='cleared'?.12:o.lifecycle==='remnant'?.12+.45*Math.min(1,o.strength/.25):Math.max(.18,Math.min(.65,o.strength/4*.65))},geometry:{type:'Polygon' as const,coordinates:[[...o.ring,o.ring[0]]]}}))??[]}),[world,visited]);
 const labels=useMemo(()=>({type:'FeatureCollection' as const,features:world?.outbreaks.map(o=>({type:'Feature' as const,properties:{label:visited.has(o.id)?'VISITED':o.status==='cleared'?'CLEARED':o.eligibleAt>Date.now()?'WAIT':o.lifecycle==='remnant'?'+'+o.cleanupBonus+' cleanup':o.lifecycle==='disintegrating'?'DISINTEGRATING':String(o.visitsRemaining)+' visits'},geometry:{type:'Point' as const,coordinates:[o.ring.reduce((n,p)=>n+p[0],0)/o.ring.length,o.ring.reduce((n,p)=>n+p[1],0)/o.ring.length]}}))??[]}),[world,visited]);
 const fitOutbreaks=()=>{setFollow(false);const points=world?.outbreaks.flatMap(o=>o.ring)??[];if(points.length)camera.current?.fitBounds([Math.min(...points.map(p=>p[0]))-.002,Math.min(...points.map(p=>p[1]))-.002,Math.max(...points.map(p=>p[0]))+.002,Math.max(...points.map(p=>p[1]))+.002],{padding:fullscreen?{top:180,right:30,bottom:bottomInset+50,left:30}:{top:30,right:30,bottom:30,left:30},duration:300});};
 const fit = () => {setFollow(false);if(route.bounds) camera.current?.fitBounds(route.bounds,{padding:fullscreen?{top:180,right:32,bottom:bottomInset+50,left:32}:{top:32,right:32,bottom:32,left:32},duration:300});};
 useEffect(()=> {if(ready && activityId && route.bounds && fitted.current!==activityId && !recording) {fit();fitted.current=activityId;}},[ready,activityId,route.bounds,recording]);
 useEffect(()=>{if(ready&&recording&&follow&&latest){const first=followedActivity.current!==activityId;const direction=travelHeading(fixes);if(direction!==null)heading.current=direction;camera.current?.easeTo({bearing:orientation==='north'?0:heading.current,padding:fullscreen?{top:160,bottom:bottomInset+40,left:24,right:24}:undefined,center:[latest.longitude,latest.latitude],duration:300,...(first?{zoom:15}:{})});followedActivity.current=activityId;}},[ready,recording,follow,orientation,latest?.timestamp,activityId,fullscreen,bottomInset]);
 return <View style={[styles.section,fullscreen&&{flex:1}]}>
  <View style={[styles.map,fullscreen&&{flex:1,height:undefined,borderRadius:0}]}><NativeMap style={StyleSheet.absoluteFill} mapStyle={offline ? OFFLINE_STYLE : BASEMAP}
   onDidFinishLoadingStyle={()=>setReady(true)} onDidFailLoadingMap={()=> {setOffline(true);setReady(false);}}
   onRegionWillChange={event=>{if(event.nativeEvent.userInteraction)setFollow(false);}} attribution logo={false}>
   <Camera ref={camera} initialViewState={{center:[23.761,61.498],zoom:12}} maxZoom={19}/>
   <GeoJSONSource id="outbreaks" data={outbreaks} onPress={event=>{const id=event.nativeEvent.features[0]?.properties?.id;if(typeof id==='string')setSelected(id);event.stopPropagation();}}>
    <Layer id="outbreak-fill" type="fill" paint={{'fill-color':['case',['get','visited'],'#21dcca',['get','unavailable'],'#8a9492',['get','clearing'],'#ab9fe8',['get','remnant'],'#e0b54e',['get','disintegrating'],'#ed7c48','#a847de'],'fill-opacity':['*',['get','intensity'],pulse]}}/>
    <Layer id="outbreak-edge" type="line" paint={{'line-color':['case',['get','visited'],'#70fff0',['get','unavailable'],'#a9b7af','#dca1ff'],'line-width':['case',['get','visited'],4,2]}}/>
   </GeoJSONSource>
   <GeoJSONSource id="outbreak-labels" data={labels}>
    <Layer id="outbreak-label" type="symbol" minzoom={10} layout={{'text-field':['get','label'],'text-font':['Noto Sans Regular'],'text-size':13}} paint={{'text-color':'#231333','text-halo-color':'#ffffff','text-halo-width':2}}/>
   </GeoJSONSource>
   <GeoJSONSource id="recorded-route" data={route.lines}>
    <Layer id="route-outline" type="line" filter={['==',['get','kind'],'recorded']} paint={{'line-color':'#10271f','line-width':7}}/>
    <Layer id="route-line" type="line" filter={['==',['get','kind'],'recorded']} paint={{'line-color':'#27c779','line-width':4}} layout={{'line-join':'round','line-cap':'round'}}/>
    <Layer id="route-gap" type="line" filter={['==',['get','kind'],'gap']} paint={{'line-color':'#eb6bad','line-width':3,'line-dasharray':[2,2]}}/>
   </GeoJSONSource>
   <GeoJSONSource id="route-markers" data={route.markers}>
    <Layer id="route-points" type="circle" paint={{'circle-radius':6,'circle-color':['match',['get','role'],'start','#9be9b4','#eb6bad'],'circle-stroke-color':'#10271f','circle-stroke-width':2}}/>
   </GeoJSONSource>
  </NativeMap></View>
  {selectedOutbreak && <View style={[styles.detail,fullscreen&&{position:'absolute',top:160,left:12,right:12}]}>
   <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text style={styles.detailTitle}>{selectedOutbreak.name}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close outbreak details" onPress={()=>setSelected(null)} style={styles.button}><Text style={styles.label}>Close</Text></Pressable></View>
   <Text style={styles.label}>{visited.has(selectedOutbreak.id)?'Visited during this outing':selectedOutbreak.eligibleAt>Date.now()?'Revisit available '+new Date(selectedOutbreak.eligibleAt).toLocaleTimeString():selectedOutbreak.status==='cleared'?'Cleared':'Available'} · {selectedOutbreak.status}</Text>
   <Text style={styles.label}>{selectedOutbreak.lifecycle==='remnant'?`${selectedOutbreak.cleanupBonus} cleanup points · one touch clears this remnant`:`${selectedOutbreak.visitPoints} visit points + ${selectedOutbreak.cleanupBonus} cleanup bonus`}</Text>
   {!!selectedOutbreak.phaseEndsAt&&<Text style={styles.label}>{selectedOutbreak.lifecycle==='disintegrating'?'Disintegrates':selectedOutbreak.lifecycle==='remnant'?'Expires':'Ready'} {new Date(selectedOutbreak.phaseEndsAt).toLocaleString()}</Text>}
   <Text style={styles.legend}>~{selectedOutbreak.visitsRemaining} visits remaining after committed cleaning</Text>
  </View>}
  {!fullscreen && <><Text style={styles.legend}>Purple: eligible outbreak · Gray: unavailable · Turquoise outline: touched during this activity · Pale purple: clearing.</Text>
  <Text style={styles.legend}>Green: recorded route · Pink dashes: GPS gaps over 2 s. Paused sections stay separate.</Text>
  {offline && <Text style={styles.legend}>Route-only view. Basemap unavailable; recording still works.</Text>}
  {!fixes.length && <Text style={styles.legend}>Tampere shown until your first GPS fix arrives.</Text>}
  </>}
  <View style={[styles.actions,fullscreen&&{position:'absolute',bottom:bottomInset+30,left:12,right:12}]}>{recording && <><Pressable accessibilityRole="button" onPress={()=>{followedActivity.current=null;setFollow(!follow);}} style={styles.button}><Text style={styles.label}>{follow?'Explore map':'Recenter'}</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>{setOrientation(orientation==='north'?'travel':'north');setFollow(true);followedActivity.current=null;}} style={styles.button}><Text style={styles.label}>{orientation==='north'?'North up':'Travel up'}</Text></Pressable></>}<Pressable accessibilityRole="button" disabled={!world} onPress={fitOutbreaks} style={styles.button}><Text style={styles.label}>Fit outbreaks</Text></Pressable><Pressable accessibilityRole="button" disabled={!route.bounds} onPress={fit} style={styles.button}><Text style={styles.label}>Fit route</Text></Pressable>
   <Pressable accessibilityRole="button" onPress={()=>{setReady(false);setOffline(!offline);}} style={styles.button}><Text style={styles.label}>{offline ? 'Load basemap' : 'Route only'}</Text></Pressable></View>
  {!offline && <Text style={[styles.attribution,fullscreen&&{position:'absolute',bottom:bottomInset+20,left:16,fontSize:10,backgroundColor:'#10271fee',paddingHorizontal:4}]}>OpenFreeMap · © OpenMapTiles · © OpenStreetMap contributors</Text>}
 </View>;
}
const styles=StyleSheet.create({detail:{padding:14,borderRadius:18,backgroundColor:'#10271ff2',gap:8},detailTitle:{color:'#eef8ef',fontSize:20,fontWeight:'700'},section:{gap:10},map:{height:320,borderRadius:16,overflow:'hidden',backgroundColor:'#152e26'},legend:{color:'#a8c6b5',fontSize:14,lineHeight:20},actions:{flexDirection:'row',gap:12,flexWrap:'wrap'},button:{padding:12,borderRadius:10,backgroundColor:'#284c3a'},label:{color:'#e6f2ea',fontWeight:'600'},attribution:{color:'#a8c6b5',fontSize:12}});
