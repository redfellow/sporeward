import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Map as NativeMap, Camera, type CameraRef, GeoJSONSource, Layer, type StyleSpecification } from '@maplibre/maplibre-react-native';
import { type Fix, routeGeometry } from '../recording/model';
const BASEMAP = 'https://tiles.openfreemap.org/styles/liberty';
const OFFLINE_STYLE: StyleSpecification = {version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#152e26'}}]};
export function RouteMap({fixes, activityId}:{fixes:Fix[];activityId:string | null}) {
 const camera=useRef<CameraRef>(null), fitted=useRef<string|null>(null);
 const [offline,setOffline]=useState(false),[ready,setReady]=useState(false);
 useEffect(()=> {
  if(offline || ready) return;
  const timer=setTimeout(()=>setOffline(true),10000);
  return ()=>clearTimeout(timer);
 },[offline,ready]);
 const route=useMemo(()=>routeGeometry(fixes),[fixes]);
 const fit = () => {if(route.bounds) camera.current?.fitBounds(route.bounds,{padding:{top:32,right:32,bottom:32,left:32},duration:300});};
 useEffect(()=> {if(ready && activityId && route.bounds && fitted.current!==activityId) {fit();fitted.current=activityId;}},[ready,activityId,route.bounds]);
 return <View style={styles.section}>
  <View style={styles.map}><NativeMap style={StyleSheet.absoluteFill} mapStyle={offline ? OFFLINE_STYLE : BASEMAP}
   onDidFinishLoadingStyle={()=>setReady(true)} onDidFailLoadingMap={()=> {setOffline(true);setReady(false);}}
   attribution logo={false}>
   <Camera ref={camera} initialViewState={{center:[23.761,61.498],zoom:12}} maxZoom={19}/>
   <GeoJSONSource id="recorded-route" data={route.lines}>
    <Layer id="route-outline" type="line" filter={['==',['get','kind'],'recorded']} paint={{'line-color':'#10271f','line-width':7}}/>
    <Layer id="route-line" type="line" filter={['==',['get','kind'],'recorded']} paint={{'line-color':'#27c779','line-width':4}} layout={{'line-join':'round','line-cap':'round'}}/>
    <Layer id="route-gap" type="line" filter={['==',['get','kind'],'gap']} paint={{'line-color':'#eb6bad','line-width':3,'line-dasharray':[2,2]}}/>
   </GeoJSONSource>
   <GeoJSONSource id="route-markers" data={route.markers}>
    <Layer id="route-points" type="circle" paint={{'circle-radius':6,'circle-color':['match',['get','role'],'start','#9be9b4','#eb6bad'],'circle-stroke-color':'#10271f','circle-stroke-width':2}}/>
   </GeoJSONSource>
  </NativeMap></View>
  <Text style={styles.legend}>Green: recorded route · Pink dashes: GPS gaps over 2 s. Paused sections stay separate.</Text>
  {offline && <Text style={styles.legend}>Route-only view. Basemap unavailable; recording still works.</Text>}
  {!fixes.length && <Text style={styles.legend}>Tampere shown until your first GPS fix arrives.</Text>}
  <View style={styles.actions}><Pressable accessibilityRole="button" disabled={!route.bounds} onPress={fit} style={styles.button}><Text style={styles.label}>Fit route</Text></Pressable>
   <Pressable accessibilityRole="button" onPress={()=>{setReady(false);setOffline(!offline);}} style={styles.button}><Text style={styles.label}>{offline ? 'Load basemap' : 'Route only'}</Text></Pressable></View>
  {!offline && <Text style={styles.attribution}>OpenFreeMap · © OpenMapTiles · © OpenStreetMap contributors</Text>}
 </View>;
}
const styles=StyleSheet.create({section:{gap:10},map:{height:320,borderRadius:16,overflow:'hidden',backgroundColor:'#152e26'},legend:{color:'#a8c6b5',fontSize:14,lineHeight:20},actions:{flexDirection:'row',gap:12,flexWrap:'wrap'},button:{padding:12,borderRadius:10,backgroundColor:'#284c3a'},label:{color:'#e6f2ea',fontWeight:'600'},attribution:{color:'#a8c6b5',fontSize:12}});
