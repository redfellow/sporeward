import {useEffect,useMemo,useRef,useState} from 'react';
import {AccessibilityInfo,AppState} from 'react-native';
import {ClipOp,PaintStyle,Skia,StrokeJoin} from '@shopify/react-native-skia';
import {Directory,File,Paths} from 'expo-file-system';
import {ImageSource,Layer} from '@maplibre/maplibre-react-native';
import {guideHaloStrokes,identitySeed,richerMembranes,guideState,guideFractures,guideMembraneMotion} from '@sporeward/rendering';
import type {WorldView} from '@sporeward/protocol';
import {growthPoint,pathFor,membranePicture,type MapViewport,type Point} from './RicherOverlay';
import {outbreakGeometry} from './outbreak-geometry';
import {outbreakPalette} from './outbreak-appearance';
import {outbreakPreparationIndex,selectPreparedOutbreaks} from './map-preparation';
type Outbreak=WorldView['outbreaks'][number];
type Material={key:string;id:string;url:string;coordinates:[Point,Point,Point,Point]};
const directory=new Directory(Paths.cache,'richer-native-prototype');
let initialized=false;
const FRAMES=8,STEP=500,ANIMATED_LIMIT=4;
function render(outbreak:Outbreak,key:string,frame:number,output:Directory,now:number,visited:boolean,world:WorldView|null):Material{
 const geometry=outbreakGeometry(outbreak,world),rings=geometry.rings.map(ring=>ring.map(growthPoint)),points=rings.flat(),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 const radius=geometry.materialRadius,padding=radius*.28,west=Math.min(...xs)-padding,north=Math.min(...ys)-padding,width=Math.max(...xs)-west+padding,height=Math.max(...ys)-north+padding;
 const scale=512/Math.max(width,height),w=Math.max(1,Math.ceil(width*scale)),h=Math.max(1,Math.ceil(height*scale));
 const surface=Skia.Surface.Make(w,h);if(!surface)throw new Error('Richer material surface unavailable.');
 const canvas=surface.getCanvas();canvas.clear(Skia.Color('transparent'));canvas.scale(scale,scale);canvas.translate(-west,-north);
 const builder=Skia.PathBuilder.Make();for(const ring of rings){ring.forEach((p,i)=>i?builder.lineTo(...p):builder.moveTo(...p));builder.close();}const path=builder.detach();builder.dispose();
 const center=geometry.center,seed=geometry.seed,state=guideState(outbreak,now,visited),palette=outbreakPalette(outbreak,now,visited);
 // Restore Clearing's broad layered stroke bands for every state. Cached Skia
 // strokes preserve round joins on irregular boundaries and avoid native spikes.
 canvas.save();
 const cracked=(outbreak.crossings??0)>=3&&!geometry.special,haloClip=cracked?pathFor(outbreak.ring.map(growthPoint)):null;
 if(haloClip)canvas.clipPath(haloClip,ClipOp.Difference,true);
 const glow=Skia.Paint();glow.setAntiAlias(true);glow.setColor(Skia.Color(palette.body));glow.setStyle(PaintStyle.Stroke);glow.setStrokeJoin(StrokeJoin.Round);
 for(const band of guideHaloStrokes){
  glow.setStrokeWidth(band.width*radius/77);glow.setAlphaf(band.opacity);canvas.drawPath(path,glow);
 }
 glow.dispose();haloClip?.dispose();canvas.restore();
 canvas.clipPath(path,ClipOp.Intersect,true);
 if(state==='disintegrating'){
  const paint=Skia.Paint();paint.setAntiAlias(true);paint.setStyle(PaintStyle.Stroke);
  for(const [index,line] of guideFractures.entries())for(let i=0;i<line.length/2-1;i++){
   const count=line.length/2-1,base=index===0?1.9:index<6?1.05:.55,width=base*Math.pow(1-i/count,1.4)+.12,b=Skia.PathBuilder.Make();
   b.moveTo(center[0]+line[i*2]*radius/77,center[1]+line[i*2+1]*radius/77);b.lineTo(center[0]+line[i*2+2]*radius/77,center[1]+line[i*2+3]*radius/77);const segment=b.detach();b.dispose();
   paint.setColor(Skia.Color(palette.deep));paint.setAlphaf(.6);paint.setStrokeWidth((width+1.6)*radius/77);canvas.drawPath(segment,paint);
   paint.setColor(Skia.Color(palette.light));paint.setAlphaf(.98);paint.setStrokeWidth(width*radius/77);canvas.drawPath(segment,paint);segment.dispose();
  }paint.dispose();
 }
 for(const m of richerMembranes(center,radius,seed)){
  const picture=membranePicture(m,palette,state),t=frame*STEP/1000,duration=FRAMES*STEP/1000,u=t/duration,blend=u*u*(3-2*u),a=guideMembraneMotion(m,t,seed,state),b=guideMembraneMotion(m,t-duration,seed,state);
  const mix=(x:number,y:number)=>x+(y-x)*blend,v={sx:mix(a.sx,b.sx),sy:mix(a.sy,b.sy),kx:mix(a.kx,b.kx),ky:mix(a.ky,b.ky),dx:mix(a.dx,b.dx),dy:mix(a.dy,b.dy)};
  canvas.save();canvas.concat([v.sx,v.kx,m.center[0]+v.dx,v.ky,v.sy,m.center[1]+v.dy,0,0,1]);canvas.drawPicture(picture);canvas.restore();picture.dispose();
 }
 // Fast Refresh preserves pose-cache refs, so retain their files in development.
 if(!initialized){if(!__DEV__&&directory.exists)directory.delete();directory.create({idempotent:true,intermediates:true});initialized=true;}
 output.create({idempotent:true,intermediates:true});
 const image=surface.makeImageSnapshot(),file=new File(output,identitySeed(key+':'+frame)+'.png');file.write(image.encodeToBytes());image.dispose();path.dispose();surface.dispose();
 const radiusEarth=6378137,c=Math.cos(61.495*Math.PI/180),y0=Math.log(Math.tan(Math.PI/4+61.495*Math.PI/360));
 const coordinate=(x:number,y:number):Point=>[23.795+x/(radiusEarth*c)*180/Math.PI,(2*Math.atan(Math.exp(y0-y/(radiusEarth*c)))-Math.PI/2)*180/Math.PI];
 return {key,id:outbreak.id,url:file.uri,coordinates:[coordinate(west,north),coordinate(west+w/scale,north),coordinate(west+w/scale,north+h/scale),coordinate(west,north+h/scale)]};
}
/** Cached vector poses crossfade natively; no camera following or per-frame raster work. */
export function RicherMapImages({world,viewport,visited}:{world:WorldView|null;viewport:MapViewport;visited:Set<string>}){
 const [output]=useState(()=>new Directory(directory,'view-'+Math.random().toString(36).slice(2)));
 const outputRevision=useRef(0);
 useEffect(()=>{const revision=++outputRevision.current;return()=>{setTimeout(()=>{if(outputRevision.current!==revision)return;try{if(output.exists)output.delete();}catch{}},5000);};},[output]);
 const cache=useRef(new Map<string,Material>()),[revision,setRevision]=useState(0),[phase,setPhase]=useState(0);
 const [foreground,setForeground]=useState(AppState.currentState==='active'),[reduced,setReduced]=useState(false);
 useEffect(()=>{const app=AppState.addEventListener('change',s=>setForeground(s==='active'));let alive=true;void AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(alive)setReduced(v);}).catch(()=>{});const motion=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);return()=>{alive=false;app.remove();motion.remove();};},[]);
 useEffect(()=>{if(!foreground||reduced||viewport.zoom<14||!world?.outbreaks.length)return;const timer=setInterval(()=>setPhase(v=>(v+1)%FRAMES),STEP);return()=>clearInterval(timer);},[foreground,reduced,viewport.zoom,world?.outbreaks.length]);
 const preparationIndex=useMemo(()=>outbreakPreparationIndex(world?.outbreaks??[]),[world]);
 const wanted=useMemo(()=>{
  if(!foreground||viewport.zoom<11.5)return [];
  return selectPreparedOutbreaks(preparationIndex,viewport).map(({outbreak:o,visible})=>({o,visible,key:JSON.stringify(['layered-clearing-halo-v1',o.id,outbreakGeometry(o,world).rings,guideState(o,world!.serverTime,visited.has(o.id)),outbreakPalette(o,world!.serverTime,visited.has(o.id))])}));
 },[world,preparationIndex,viewport,foreground,visited]);
 useEffect(()=>{
  let cancelled=false,timer:ReturnType<typeof setTimeout>;
  for(const v of wanted)for(let frame=0;frame<FRAMES;frame++){const key=v.key+':'+frame,item=cache.current.get(key);if(item){cache.current.delete(key);cache.current.set(key,item);}}
  const jobs=wanted.map(v=>({...v,frame:0}));
  if(!reduced&&viewport.zoom>=14)for(let frame=1;frame<FRAMES;frame++)for(const v of wanted.filter(v=>v.visible).slice(0,ANIMATED_LIMIT))jobs.push({...v,frame});
  const queue=jobs.filter(v=>!cache.current.has(v.key+':'+v.frame));
  const next=()=>{
   if(cancelled||AppState.currentState!=='active')return;
   const item=queue.shift();if(!item)return;
   try{cache.current.set(item.key+':'+item.frame,render(item.o,item.key,item.frame,output,world!.serverTime,visited.has(item.o.id),world));while(cache.current.size>192){const key=cache.current.keys().next().value!,old=cache.current.get(key)!;cache.current.delete(key);try{new File(old.url).delete();}catch{}}setRevision(v=>v+1);}catch(error){console.warn('Richer native-map material unavailable.',String(error));}
   timer=setTimeout(next,16);
  };
  timer=setTimeout(next,0);return()=>{cancelled=true;clearTimeout(timer);};
 },[wanted,reduced,viewport.zoom>=14]);
 const images=useMemo(()=>wanted.flatMap((v,index)=>{
  const animated=viewport.zoom>=14&&v.visible&&index<ANIMATED_LIMIT&&!reduced&&Array.from({length:FRAMES},(_,f)=>cache.current.has(v.key+':'+f)).every(Boolean);
  return Array.from({length:animated?FRAMES:1},(_,frame)=>{const material=cache.current.get(v.key+':'+frame);return material?{...material,frame,animated}:null;}).filter((m):m is Material&{frame:number;animated:boolean}=>m!==null);
 }),[wanted,revision,reduced,viewport.zoom>=14]);
 return <>{images.map(m=><ImageSource key={m.id+':'+m.frame} id={'richer-image-'+m.id+'-'+m.frame} url={m.url} coordinates={m.coordinates}><Layer id={'richer-material-'+m.id+'-'+m.frame} type="raster" minzoom={12} paint={{'raster-opacity':!m.animated||m.frame===phase?1:0,'raster-opacity-transition':{duration:reduced?0:STEP,delay:0},'raster-fade-duration':0}}/></ImageSource>)}</>;
}
