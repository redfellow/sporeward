import {useEffect,useMemo,useRef,useState} from 'react';
import {AccessibilityInfo,AppState} from 'react-native';
import {Skia} from '@shopify/react-native-skia';
import {Directory,File,Paths} from 'expo-file-system';
import {GeoJSONSource,ImageSource,Images,Layer} from '@maplibre/maplibre-react-native';
import {surveyStationSvg,guideBadgeSvg,type GuideState} from '@sporeward/rendering';
import type {WorldView} from '@sporeward/protocol';
import {outbreakMarkers} from './outbreak-geometry';
import {outbreakMarkerComposition} from './outbreak-appearance';
import {growthPoint,growthCoordinate,type MapViewport} from './RicherOverlay';

const FRAMES=8,STEP=500;
/** Cached accepted artwork. Close stations use geographic images; distant labs use readable native markers. */
export function FieldLabLayers({world,viewport,bright,provisional,visited,onSelect,onOutbreakSelect}:{world:WorldView|null;viewport:MapViewport;bright:boolean;provisional:Set<string>;visited:Set<string>;onSelect:(id:string)=>void;onOutbreakSelect:(id:string)=>void}){
 const [foreground,setForeground]=useState(AppState.currentState==='active'),[reduced,setReduced]=useState(false),[phase,setPhase]=useState(0);
 const [directory]=useState(()=>new Directory(Paths.cache,'field-labs-'+Math.random().toString(36).slice(2)));
 const directoryRevision=useRef(0);
 const [images,setImages]=useState<Record<string,string>>({});
 useEffect(()=>{const app=AppState.addEventListener('change',state=>setForeground(state==='active'));let alive=true;void AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(alive)setReduced(value);});const motion=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);return()=>{alive=false;app.remove();motion.remove();};},[]);
 useEffect(()=>{
  directory.create({intermediates:true,idempotent:true});const result:Record<string,string>={};
  try{
   for(const collected of [false,true])for(let frame=0;frame<(collected?1:FRAMES);frame++){
    const name=`lab-${bright?'day':'night'}-${collected?'collected':'available'}-${frame}`;
    const surface=Skia.Surface.Make(256,256),svg=Skia.SVG.MakeFromString(surveyStationSvg(collected,frame*STEP/1000,bright));
    if(!surface||!svg)throw new Error('Survey station artwork unavailable');
    // drawSvg uses the SVG's intrinsic 128px size; scale the canvas explicitly.
    const canvas=surface.getCanvas();canvas.clear(Skia.Color('transparent'));canvas.scale(2,2);canvas.drawSvg(svg);
    const image=surface.makeImageSnapshot(),file=new File(directory,name+'.png');file.write(image.encodeToBytes());result[name]=file.uri;
    image.dispose();svg.dispose();surface.dispose();
   }
   for(const state of ['easy','medium','hard','disintegrating','remnant','withering','clearing','cracking','stabilizing','cooldown','visited','lab','lab-collected'] as (GuideState|'lab'|'lab-collected')[]){
    const surface=Skia.Surface.Make(96,96),svg=Skia.SVG.MakeFromString(guideBadgeSvg(state,bright));if(!surface||!svg)throw new Error('Guide badge unavailable');
    surface.getCanvas().clear(Skia.Color('transparent'));surface.getCanvas().drawSvg(svg,96,96);const image=surface.makeImageSnapshot(),file=new File(directory,'badge-'+state+'-'+bright+'.png');file.write(image.encodeToBytes());result['badge-'+state]=file.uri;image.dispose();svg.dispose();surface.dispose();
   }
   setImages(result);
  }catch{setImages({});}
 },[bright,directory]);
 useEffect(()=>{const revision=++directoryRevision.current;return()=>{setTimeout(()=>{if(directoryRevision.current!==revision)return;try{if(directory.exists)directory.delete();}catch{}},5000);};},[directory]);
 const visible=useMemo(()=>{
  const [west,south,east,north]=viewport.bounds;
  return (world?.fieldLabs??[]).filter(lab=>{const xs=lab.ring.map(p=>p[0]),ys=lab.ring.map(p=>p[1]);return lab.expiresAt>(world?.serverTime??Date.now())&&Math.max(...xs)>=west&&Math.min(...xs)<=east&&Math.max(...ys)>=south&&Math.min(...ys)<=north;}).slice(0,8);
 },[world,viewport]);
 const animated=foreground&&!reduced&&viewport.zoom>=14.5&&visible.some(lab=>!lab.collected&&!provisional.has(lab.id));
 useEffect(()=>{if(!animated)return;const timer=setInterval(()=>setPhase(value=>(value+1)%FRAMES),STEP);return()=>clearInterval(timer);},[animated]);
 const badges=useMemo(()=>({type:'FeatureCollection' as const,features:outbreakMarkers(world).map(({outbreak:o,anchor})=>{const marker=outbreakMarkerComposition(o,world!.serverTime,visited.has(o.id));return {type:'Feature' as const,properties:{id:o.id,icon:marker.icon,contacted:marker.contacted,contactIcon:marker.contactIcon??'',color:marker.palette.body},geometry:{type:'Point' as const,coordinates:anchor}};})}),[world,visited]);
 const footprints=useMemo(()=>({type:'FeatureCollection' as const,features:visible.map(lab=>({type:'Feature' as const,properties:{id:lab.id,collected:lab.collected||provisional.has(lab.id)},geometry:{type:'Polygon' as const,coordinates:[[...lab.ring,lab.ring[0]]]}}))}),[visible,provisional]);
 const stations=useMemo(()=>visible.flatMap(lab=>{
  const collected=lab.collected||provisional.has(lab.id),name=`lab-${bright?'day':'night'}-${collected?'collected':'available'}-${collected||!animated?0:phase}`,url=images[name];
  if(!url)return [];
  const [x,y]=growthPoint(lab.position),half=115;
  return [{id:lab.id,url,coordinates:[growthCoordinate([x-half,y-half]),growthCoordinate([x+half,y-half]),growthCoordinate([x+half,y+half]),growthCoordinate([x-half,y+half])] as [[number,number],[number,number],[number,number],[number,number]]}];
 }),[visible,bright,provisional,animated,phase,images]);
 const data=useMemo(()=>({type:'FeatureCollection' as const,features:visible.map(lab=>({type:'Feature' as const,geometry:{type:'Point' as const,coordinates:lab.position},properties:{id:lab.id,overviewIcon:lab.collected||provisional.has(lab.id)?'badge-lab-collected':'badge-lab'}}))}),[visible,provisional]);
 return <>
  <Images images={Object.fromEntries(Object.entries(images).filter(([key])=>key.startsWith('badge-')))}/>
  <GeoJSONSource key="outbreak-guide-badges" id="outbreak-guide-badges" data={badges} onPress={event=>{const id=event.nativeEvent.features[0]?.properties?.id;if(typeof id==='string')onOutbreakSelect(id);event.stopPropagation();}}>
   <Layer key="outbreak-guide-badge-icons" id="outbreak-guide-badge-icons" type="symbol" minzoom={14} layout={{'icon-image':['get','icon'],'icon-size':['interpolate',['linear'],['zoom'],10,.18,12,.25,14,.5],'icon-allow-overlap':true}}/>
   <Layer key="outbreak-contact-check" id="outbreak-contact-check" type="symbol" minzoom={14} filter={['==',['get','contacted'],true]} layout={{'icon-image':['get','contactIcon'],'icon-size':['interpolate',['linear'],['zoom'],10,.18,12,.2,14,.22],'icon-offset':[12,12],'icon-allow-overlap':true,'icon-ignore-placement':true}}/>
  </GeoJSONSource>
  <GeoJSONSource key="field-lab-collection-areas" id="field-lab-collection-areas" data={footprints} onPress={event=>{const id=event.nativeEvent.features[0]?.properties?.id;if(typeof id==='string')onSelect(id);event.stopPropagation();}}>
   <Layer key="field-lab-area-fill" id="field-lab-area-fill" type="fill" minzoom={13} paint={{'fill-color':bright?'#247d71':'#70e5cd','fill-opacity':['case',['get','collected'],.035,.12]}}/>
   <Layer key="field-lab-area-boundary" id="field-lab-area-boundary" type="line" minzoom={13} paint={{'line-color':bright?'#247d71':'#a5f4df','line-width':2,'line-opacity':['case',['get','collected'],.45,.9],'line-dasharray':[3,2]}}/>
  </GeoJSONSource>
  {stations.map(station=><ImageSource key={station.id} id={'field-lab-art-'+station.id} url={station.url} coordinates={station.coordinates}><Layer id={'field-lab-art-layer-'+station.id} type="raster" minzoom={14.5} paint={{'raster-opacity':1,'raster-fade-duration':0}}/></ImageSource>)}
  <GeoJSONSource key="field-lab-destinations" id="field-lab-destinations" data={data} onPress={event=>{const id=event.nativeEvent.features[0]?.properties?.id;if(typeof id==='string')onSelect(id);event.stopPropagation();}}>
   <Layer key="field-lab-circular-glow" id="field-lab-circular-glow" type="circle" minzoom={11.375} paint={{'circle-radius':['interpolate',['linear'],['zoom'],11,52,14,80,17,130],'circle-color':bright?'#348e7d':'#8ae6d9','circle-blur':.7,'circle-opacity':.3}}/>
   <Layer key="field-lab-circular-base" id="field-lab-circular-base" type="circle" minzoom={11.375} paint={{'circle-radius':['interpolate',['linear'],['zoom'],11,32,14,50,17,80],'circle-color':bright?'#277566':'#28675d','circle-opacity':.25}}/>
   <Layer key="field-lab-overview-marker" id="field-lab-overview-marker" type="symbol" minzoom={14} maxzoom={14.5} layout={{'icon-image':['get','overviewIcon'],'icon-size':['interpolate',['linear'],['zoom'],10,.23,12,.35,14,.8],'icon-allow-overlap':true,'icon-ignore-placement':true}}/>
  </GeoJSONSource>
 </>;
}
