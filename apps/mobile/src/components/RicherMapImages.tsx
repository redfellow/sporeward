import {useEffect,useMemo,useRef,useState} from 'react';
import {AccessibilityInfo,AppState} from 'react-native';
import {ClipOp,Skia} from '@shopify/react-native-skia';
import {Directory,File,Paths} from 'expo-file-system';
import {ImageSource,Layer} from '@maplibre/maplibre-react-native';
import {identitySeed,richerMembranes,membraneMotion} from '@sporeward/rendering';
import type {WorldView} from '@sporeward/protocol';
import {growthPoint,pathFor,membranePicture,type MapViewport,type Point} from './RicherOverlay';
import {outbreakPalette} from './outbreak-appearance';
type Outbreak=WorldView['outbreaks'][number];
type Material={key:string;id:string;url:string;coordinates:[Point,Point,Point,Point]};
const directory=new Directory(Paths.cache,'richer-native-prototype');
let initialized=false;
const FRAMES=16,STEP=500;
function render(outbreak:Outbreak,key:string,frame:number,output:Directory):Material{
 const points=outbreak.ring.map(growthPoint),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 const west=Math.min(...xs),north=Math.min(...ys),width=Math.max(...xs)-west,height=Math.max(...ys)-north;
 const scale=384/Math.max(width,height),w=Math.max(1,Math.ceil(width*scale)),h=Math.max(1,Math.ceil(height*scale));
 const surface=Skia.Surface.Make(w,h);if(!surface)throw new Error('Richer material surface unavailable.');
 const canvas=surface.getCanvas();canvas.clear(Skia.Color('transparent'));canvas.scale(scale,scale);canvas.translate(-west,-north);
 const path=pathFor(points);canvas.clipPath(path,ClipOp.Intersect,true);
 const center:Point=[west+width/2,north+height/2],radius=Math.max(width,height)/2.3,seed=identitySeed(outbreak.id)%10000;
 for(const m of richerMembranes(center,radius,seed)){
  const picture=membranePicture(m,outbreakPalette(outbreak)),t=frame*STEP/1000,duration=FRAMES*STEP/1000,u=t/duration,blend=u*u*(3-2*u),a=membraneMotion(m,t,seed),b=membraneMotion(m,t-duration,seed);
  const mix=(x:number,y:number)=>x+(y-x)*blend,v={sx:mix(a.sx,b.sx),sy:mix(a.sy,b.sy),kx:mix(a.kx,b.kx),ky:mix(a.ky,b.ky),dx:mix(a.dx,b.dx),dy:mix(a.dy,b.dy)};
  canvas.save();canvas.concat([v.sx,v.kx,m.center[0]+v.dx,v.ky,v.sy,m.center[1]+v.dy,0,0,1]);canvas.drawPicture(picture);canvas.restore();picture.dispose();
 }
 if(!initialized){if(directory.exists)directory.delete();directory.create({idempotent:true,intermediates:true});initialized=true;}
 output.create({idempotent:true,intermediates:true});
 const image=surface.makeImageSnapshot(),file=new File(output,identitySeed(key+':'+frame)+'.png');file.write(image.encodeToBytes());image.dispose();path.dispose();surface.dispose();
 const radiusEarth=6378137,c=Math.cos(61.495*Math.PI/180),y0=Math.log(Math.tan(Math.PI/4+61.495*Math.PI/360));
 const coordinate=(x:number,y:number):Point=>[23.795+x/(radiusEarth*c)*180/Math.PI,(2*Math.atan(Math.exp(y0-y/(radiusEarth*c)))-Math.PI/2)*180/Math.PI];
 return {key,id:outbreak.id,url:file.uri,coordinates:[coordinate(west,north),coordinate(west+w/scale,north),coordinate(west+w/scale,north+h/scale),coordinate(west,north+h/scale)]};
}
/** Cached vector poses crossfade natively; no camera following or per-frame raster work. */
export function RicherMapImages({world,viewport}:{world:WorldView|null;viewport:MapViewport}){
 const [output]=useState(()=>new Directory(directory,'view-'+Math.random().toString(36).slice(2)));
 useEffect(()=>()=>{try{if(output.exists)output.delete();}catch{}},[output]);
 const cache=useRef(new Map<string,Material>()),[revision,setRevision]=useState(0),[phase,setPhase]=useState(0);
 const [foreground,setForeground]=useState(AppState.currentState==='active'),[reduced,setReduced]=useState(false);
 useEffect(()=>{const app=AppState.addEventListener('change',s=>setForeground(s==='active'));let alive=true;void AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(alive)setReduced(v);}).catch(()=>{});const motion=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);return()=>{alive=false;app.remove();motion.remove();};},[]);
 useEffect(()=>{if(!foreground||reduced||viewport.zoom<12.5)return;const timer=setInterval(()=>setPhase(v=>(v+1)%FRAMES),STEP);return()=>clearInterval(timer);},[foreground,reduced,viewport.zoom]);
 const wanted=useMemo(()=>{
  if(!foreground||viewport.zoom<12.5)return [];
  const [west,south,east,north]=viewport.bounds;
  return (world?.outbreaks??[]).filter(o=>Math.max(...o.ring.map(p=>p[0]))>=west&&Math.min(...o.ring.map(p=>p[0]))<=east&&Math.max(...o.ring.map(p=>p[1]))>=south&&Math.min(...o.ring.map(p=>p[1]))<=north).sort((a,b)=>Math.hypot((a.ring[0][0]-viewport.center[0])*.48,a.ring[0][1]-viewport.center[1])-Math.hypot((b.ring[0][0]-viewport.center[0])*.48,b.ring[0][1]-viewport.center[1])).slice(0,24).map(o=>({o,key:JSON.stringify([o.id,o.ring,outbreakPalette(o)])}));
 },[world,viewport,foreground]);
 useEffect(()=>{
  let cancelled=false,timer:ReturnType<typeof setTimeout>;
  for(const v of wanted)for(let frame=0;frame<FRAMES;frame++){const key=v.key+':'+frame,item=cache.current.get(key);if(item){cache.current.delete(key);cache.current.set(key,item);}}
  const jobs=wanted.map(v=>({...v,frame:0}));
  if(!reduced)for(let frame=1;frame<FRAMES;frame++)for(const v of wanted.slice(0,8))jobs.push({...v,frame});
  const queue=jobs.filter(v=>!cache.current.has(v.key+':'+v.frame));
  const next=()=>{
   if(cancelled||AppState.currentState!=='active')return;
   const item=queue.shift();if(!item)return;
   try{cache.current.set(item.key+':'+item.frame,render(item.o,item.key,item.frame,output));while(cache.current.size>192){const key=cache.current.keys().next().value!,old=cache.current.get(key)!;cache.current.delete(key);try{new File(old.url).delete();}catch{}}setRevision(v=>v+1);}catch{console.warn('Richer native-map material unavailable.');}
   timer=setTimeout(next,16);
  };
  timer=setTimeout(next,0);return()=>{cancelled=true;clearTimeout(timer);};
 },[wanted,reduced]);
 const images=useMemo(()=>wanted.flatMap((v,index)=>{
  const animated=index<8&&!reduced&&Array.from({length:FRAMES},(_,f)=>cache.current.has(v.key+':'+f)).every(Boolean);
  return Array.from({length:animated?FRAMES:1},(_,frame)=>{const material=cache.current.get(v.key+':'+frame);return material?{...material,frame,animated}:null;}).filter((m):m is Material&{frame:number;animated:boolean}=>m!==null);
 }),[wanted,revision,reduced]);
 return <>{images.map(m=><ImageSource key={m.id+':'+m.frame} id={'richer-image-'+m.id+'-'+m.frame} url={m.url} coordinates={m.coordinates}><Layer id={'richer-material-'+m.id+'-'+m.frame} type="raster" paint={{'raster-opacity':!m.animated||m.frame===phase?1:0,'raster-opacity-transition':{duration:reduced?0:STEP,delay:0},'raster-fade-duration':0}}/></ImageSource>)}</>;
}
