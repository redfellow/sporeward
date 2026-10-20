import {useEffect,useMemo,useRef,useState} from 'react';
import {AppState} from 'react-native';
import {useImage} from '@shopify/react-native-skia';
import type {WorldView} from '@sporeward/protocol';
import {prepareMaterial,rasterKey,removeRaster,renderGrowth,type GrowthRaster} from './growth-raster';
export type MapViewport={center:[number,number];bounds:[number,number,number,number];zoom:number};
/** Work only on visible outbreaks, one raster per task. Bounded LRU; nothing per GPS fix. */
export function useGrowthRasters(world:WorldView|null,viewport:MapViewport){
 const [foreground,setForeground]=useState(AppState.currentState==='active');
 useEffect(()=>{const sub=AppState.addEventListener('change',state=>setForeground(state==='active'));return()=>sub.remove();},[]);
 const texture=useImage(require('../../assets/rendering/spore-wet-folds.png'));
 const sources=useMemo(()=>texture?prepareMaterial(texture):null,[texture]);
 const cache=useRef(new Map<string,GrowthRaster>()),[revision,setRevision]=useState(0);
 const wanted=useMemo(()=>{
  if(!foreground)return [];
  const now=Date.now(),[west,south,east,north]=viewport.bounds;
  return (world?.outbreaks??[]).filter(o=>{
   const xs=o.ring.map(p=>p[0]),ys=o.ring.map(p=>p[1]);
   return Math.max(...xs)>=west&&Math.min(...xs)<=east&&Math.max(...ys)>=south&&Math.min(...ys)<=north;
  }).sort((a,b)=>{
   const distance=(o:typeof a)=>Math.hypot((o.ring[0][0]-viewport.center[0])*.48,o.ring[0][1]-viewport.center[1]);return distance(a)-distance(b);
  }).slice(0,40).map(o=>({outbreak:o,key:rasterKey(o,now)}));
 },[world,viewport,foreground]);
 useEffect(()=>{
  if(!sources||!foreground)return;
  let cancelled=false,timer:ReturnType<typeof setTimeout>;
  const queue=wanted.filter(o=>!cache.current.has(o.key));
  const next=()=>{
   if(cancelled||AppState.currentState!=='active')return;
   const job=queue.shift();if(!job)return;
   try{
    const raster=renderGrowth(job.outbreak,sources,Date.now());cache.current.set(job.key,raster);
    while(cache.current.size>64){const key=cache.current.keys().next().value!;const old=cache.current.get(key)!;cache.current.delete(key);removeRaster(old);}
    setRevision(r=>r+1);
   }catch(error){console.warn('Outbreak material unavailable; retaining map boundary.',error instanceof Error?error.message:'');}
   timer=setTimeout(next,24);
  };
  for(const {key} of wanted){const item=cache.current.get(key);if(item){cache.current.delete(key);cache.current.set(key,item);}}
  timer=setTimeout(next,80);
  return()=>{cancelled=true;clearTimeout(timer);};
 },[sources,wanted,foreground]);
 useEffect(()=>()=>{for(const raster of cache.current.values())removeRaster(raster);cache.current.clear();},[]);
 return useMemo(()=>wanted.flatMap(({key})=>{const r=cache.current.get(key);return r?[r]:[];}),[wanted,revision]);
}
