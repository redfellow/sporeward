import {Canvas,Circle,Path,Skia} from '@shopify/react-native-skia';
import {StaticMapImageManager} from '@maplibre/maplibre-react-native';
import type {ActivityFootprint} from '@sporeward/protocol';
import {File} from 'expo-file-system';
import {useEffect,useMemo,useState} from 'react';
import {Image,StyleSheet,View} from 'react-native';
import type {Fix} from '../recording/model';
import {gameMapStyle} from './map-theme';
import {thumbnailRoute} from './outing-thumbnail-model';
import {MapAttribution} from './MapAttribution';

const WIDTH=320,HEIGHT=96;
// Native snapshots are serialized instead of starting a live map for every card.
let snapshots:Promise<unknown>=Promise.resolve();
/** Native static basemap with a route-only fallback while loading or offline. */
export function OutingThumbnail({fixes,footprints,brightMap=false}:{fixes:Fix[];footprints:ActivityFootprint[];brightMap?:boolean}){
 const [width,setWidth]=useState(WIDTH),[image,setImage]=useState<string|null>(null);
 const route=useMemo(()=>thumbnailRoute(fixes),[fixes]);
 const bounds=useMemo(()=>{
  if(!route.bounds)return null;
  const result:[number,number,number,number]=[...route.bounds];
  for(const footprint of footprints)for(const [x,y] of footprint.ring){result[0]=Math.min(result[0],x-.0002);result[1]=Math.min(result[1],y-.0002);result[2]=Math.max(result[2],x+.0002);result[3]=Math.max(result[3],y+.0002);}
  return result;
 },[route.bounds,footprints]);
 useEffect(()=>{
  let alive=true,uri:string|undefined;setImage(null);
  const dispose=()=>{try{if(uri)new File(uri).delete();}catch{}};
  if(!bounds)return;
  const style=gameMapStyle(brightMap);
  style.sources={...style.sources,
   'outing-route':{type:'geojson',data:route.lines},
   'outing-spores':{type:'geojson',data:{type:'FeatureCollection',features:footprints.map(item=>({type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[...item.ring,item.ring[0]]]}}))}},
   'outing-endpoints':{type:'geojson',data:route.markers},
  };
  style.layers=[...style.layers,
   {id:'outing-spores',type:'fill',source:'outing-spores',paint:{'fill-color':'#ee793b','fill-opacity':.45}},
   {id:'outing-contact',type:'line',source:'outing-spores',paint:{'line-color':'#42e0bd','line-width':2}},
   {id:'outing-outline',type:'line',source:'outing-route',filter:['==',['get','kind'],'recorded'],paint:{'line-color':'#fff3df','line-width':5},layout:{'line-cap':'round','line-join':'round'}},
   {id:'outing-line',type:'line',source:'outing-route',filter:['==',['get','kind'],'recorded'],paint:{'line-color':'#e42fa5','line-width':2.6},layout:{'line-cap':'round','line-join':'round'}},
   {id:'outing-gap',type:'line',source:'outing-route',filter:['==',['get','kind'],'gap'],paint:{'line-color':'#eb6bad','line-width':2,'line-dasharray':[2,2]}},
   {id:'outing-endpoints',type:'circle',source:'outing-endpoints',paint:{'circle-radius':3,'circle-color':['match',['get','role'],'start','#ffffff','#e42fa5'],'circle-stroke-color':'#10271f','circle-stroke-width':1}},
  ];
  snapshots=snapshots.catch(()=>{}).then(async()=>{
   if(!alive)return;
   try{uri=await StaticMapImageManager.createImage({mapStyle:style,bounds,width:Math.round(width*2),height:HEIGHT*2,output:'file',logo:false});if(alive)setImage(uri);else dispose();}catch{/* Keep the local route available without a basemap. */}
  });
  return()=>{alive=false;dispose();};
 },[route,bounds,footprints,brightMap,width]);
 const paths=useMemo(()=>{
  const all:[number,number][]=[...fixes.map(f=>[f.longitude,f.latitude] as [number,number]),...footprints.flatMap(f=>f.ring)];
  if(!all.length)return {route:[] as ReturnType<typeof Skia.Path.Make>[],spores:[] as ReturnType<typeof Skia.Path.Make>[],start:null as [number,number]|null,end:null as [number,number]|null};
  const lat0=all.reduce((n,p)=>n+p[1],0)/all.length,cos=Math.max(.25,Math.cos(lat0*Math.PI/180));
  const xy=all.map(([lon,lat])=>[lon*cos,lat] as [number,number]);
  const [west,south,east,north]=xy.reduce(([w,s,e,n],[x,y])=>[Math.min(w,x),Math.min(s,y),Math.max(e,x),Math.max(n,y)],[Infinity,Infinity,-Infinity,-Infinity]);
  const sx=(width-24)/Math.max(1e-8,east-west),sy=(HEIGHT-20)/Math.max(1e-8,north-south),scale=Math.min(sx,sy);
  const ox=width/2-(west+east)*scale/2,oy=HEIGHT/2+(north+south)*scale/2;
  const project=([lon,lat]:[number,number]):[number,number]=>[lon*cos*scale+ox,oy-lat*scale];
  const paths=route.lines.features.filter(feature=>feature.properties?.kind==='recorded').map(feature=>{const path=Skia.Path.Make();feature.geometry.coordinates.forEach((point,index)=>{const [x,y]=project(point as [number,number]);if(index===0)path.moveTo(x,y);else path.lineTo(x,y);});return path;});
  const spores:ReturnType<typeof Skia.Path.Make>[]=[];
  for(const footprint of footprints){
   const path=Skia.Path.Make();footprint.ring.forEach((point,i)=>{const p=project(point);if(i===0)path.moveTo(p[0],p[1]);else path.lineTo(p[0],p[1]);});path.close();spores.push(path);
  }
  const start=fixes[0]?project([fixes[0].longitude,fixes[0].latitude]):null,last=fixes.at(-1),end=last?project([last.longitude,last.latitude]):null;
  return {route:paths,spores,start,end};
 },[fixes,footprints,route,width]);
 useEffect(()=>()=>{for(const path of [...paths.route,...paths.spores])path.dispose();},[paths]);
 return <View><View style={styles.frame} onLayout={event=>setWidth(Math.max(1,Math.round(event.nativeEvent.layout.width)))}>{image?<Image source={{uri:image}} style={styles.canvas} resizeMode="cover"/>:<Canvas style={styles.canvas} pointerEvents="none">
  {paths.spores.map((path,i)=><Path key={`s${i}`} path={path} color="#ee793b55" style="fill"/>)}
  {paths.spores.map((path,i)=><Path key={`sr${i}`} path={path} color="#ffbd70aa" style="stroke" strokeWidth={1.2}/>)}
  {paths.route.map((path,i)=><Path key={`halo${i}`} path={path} color="#fff3df" style="stroke" strokeWidth={5} strokeCap="round" strokeJoin="round"/>)}
  {paths.route.map((path,i)=><Path key={`route${i}`} path={path} color="#e42fa5" style="stroke" strokeWidth={2.6} strokeCap="round" strokeJoin="round"/>)}
  {paths.start&&<Circle cx={paths.start[0]} cy={paths.start[1]} r={4} color="#f8fff9"/>}
  {paths.end&&<Circle cx={paths.end[0]} cy={paths.end[1]} r={3} color="#e42fa5"/>}
 </Canvas>}</View>{image&&<MapAttribution/>}</View>;
}
const styles=StyleSheet.create({frame:{height:96,borderRadius:13,overflow:'hidden',backgroundColor:'#18352f',borderWidth:1,borderColor:'#426451'},canvas:{width:'100%',height:96}});
