import {useEffect,useMemo,useState} from 'react';
import {AccessibilityInfo,AppState,StyleSheet} from 'react-native';
import {Canvas,ClipOp,Group,PaintStyle,Picture,Skia,StrokeJoin,TileMode,vec,type SkCanvas,type SkPath,type SkPicture,type SkRect} from '@shopify/react-native-skia';
import {useDerivedValue,useFrameCallback,useSharedValue,type SharedValue} from 'react-native-reanimated';
import {identitySeed,membraneMotion,membranePoints,richerMembranes,type Membrane} from '@sporeward/rendering';
import {outbreakPalette} from './outbreak-appearance';
import type {WorldView} from '@sporeward/protocol';
export type Point=[number,number];
export type MapViewport={center:Point;bounds:[number,number,number,number];zoom:number};
export type GrowthCamera={center:Point;zoom:number;bearing:number;width:number;height:number;anchor:Point;scaleFactor?:number};
const R=6378137,C=Math.cos(61.495*Math.PI/180),ORIGIN:Point=[23.795,61.495],Y0=Math.log(Math.tan(Math.PI/4+ORIGIN[1]*Math.PI/360));
export function growthPoint([lon,lat]:Point):Point{
 'worklet';return [(lon-ORIGIN[0])*Math.PI/180*R*C,(Y0-Math.log(Math.tan(Math.PI/4+Math.max(-85,Math.min(85,lat))*Math.PI/360)))*R*C];
}
function pathFor(points:Point[],smooth=false){
 const b=Skia.PathBuilder.Make();
 if(smooth){const last=points.at(-1)!,first=points[0];b.moveTo((last[0]+first[0])/2,(last[1]+first[1])/2);points.forEach((p,i)=>{const n=points[(i+1)%points.length];b.quadTo(p[0],p[1],(p[0]+n[0])/2,(p[1]+n[1])/2);});}
 else points.forEach((p,i)=>i?b.lineTo(...p):b.moveTo(...p));
 b.close();const path=b.detach();b.dispose();return path;
}
function picture(draw:(canvas:SkCanvas)=>void,bounds:SkRect){const recorder=Skia.PictureRecorder(),canvas=recorder.beginRecording(bounds);draw(canvas);const result=recorder.finishRecordingAsPicture();recorder.dispose();return result;}
type Palette=ReturnType<typeof outbreakPalette>;
function membranePicture(m:Membrane,p:Palette):SkPicture{
 return picture(canvas=>{
  const path=pathFor(membranePoints(m.radius,m.seed),true),paint=Skia.Paint();paint.setAntiAlias(true);
  const a=vec(-m.radius,-m.radius),b=vec(m.radius,m.radius);
  const fill=Skia.Shader.MakeLinearGradient(a,b,[(m.light?p.light:p.body)+'55',(m.light?p.light:p.body)+'20',p.body+'08'].map(Skia.Color),[0,.6,1],TileMode.Clamp);
  paint.setShader(fill);canvas.drawPath(path,paint);
  const rim=Skia.Shader.MakeLinearGradient(a,b,(m.small?[p.light+'a0',p.rim+'90',p.deep+'50']:[(m.light?p.light:p.rim)+'85',(m.light?p.light:p.rim)+'85']).map(Skia.Color),null,TileMode.Clamp);
  paint.setShader(rim);paint.setStyle(PaintStyle.Stroke);paint.setStrokeWidth(m.small?1.35:1.4);canvas.drawPath(path,paint);
  paint.setShader(null);
  if(m.core){const core=pathFor(membranePoints(m.radius*.57,m.seed+8).map(([x,y])=>[x+m.radius*.12,y-m.radius*.1]),true);paint.setStyle(PaintStyle.Fill);paint.setColor(Skia.Color(p.deep+'20'));canvas.drawPath(core,paint);paint.setStyle(PaintStyle.Stroke);paint.setStrokeWidth(1);paint.setColor(Skia.Color(p.rim+'60'));canvas.drawPath(core,paint);core.dispose();}
  path.dispose();paint.dispose();fill.dispose();rim.dispose();
 },Skia.XYWHRect(-m.radius*2,-m.radius*2,m.radius*4,m.radius*4));
}
type Body={outbreak:WorldView['outbreaks'][number];path:SkPath;center:Point;radius:number;seed:number;palette:Palette};
/** Body, rim and moving interiors share one canvas/viewport transform. Native sources are hit targets only. */
export function RicherOverlay({world,viewport,camera,visited}:{world:WorldView|null;viewport:MapViewport;camera:SharedValue<GrowthCamera>;visited:Set<string>}){
 const [active,setActive]=useState(AppState.currentState==='active'),[reduced,setReduced]=useState(false);
 useEffect(()=>{const app=AppState.addEventListener('change',s=>setActive(s==='active'));let alive=true;void AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(alive)setReduced(v);}).catch(()=>{});const reduce=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);return()=>{alive=false;app.remove();reduce.remove();};},[]);
 const clock=useSharedValue(0),last=useSharedValue(0);
 const frames=useFrameCallback(info=>{'worklet';if(info.timestamp-last.value<33)return;clock.value+=(last.value?Math.min(100,info.timestamp-last.value):33)/1000;last.value=info.timestamp;},false);
 useEffect(()=>{last.value=0;frames.setActive(active&&!reduced&&viewport.zoom>=12.5);return()=>frames.setActive(false);},[active,reduced,viewport.zoom,frames]);
 const bodies=useMemo<Body[]>(()=> (world?.outbreaks??[]).filter(o=>o.ring.length>=3).map(o=>{
  const points=o.ring.map(growthPoint),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),w=Math.min(...xs),e=Math.max(...xs),n=Math.min(...ys),s=Math.max(...ys);
  return {outbreak:o,path:pathFor(points),center:[(w+e)/2,(n+s)/2],radius:Math.max(e-w,s-n)/2.3,seed:identitySeed(o.id)%10000,palette:outbreakPalette(o)};
 }),[world]);
 const bounds=useMemo(()=>{
  const rectangles=bodies.map(b=>b.path.getBounds());
  if(!rectangles.length)return Skia.XYWHRect(-1,-1,2,2);
  const west=Math.min(...rectangles.map(r=>r.x))-24,north=Math.min(...rectangles.map(r=>r.y))-24;
  return Skia.XYWHRect(west,north,Math.max(...rectangles.map(r=>r.x+r.width))+24-west,Math.max(...rectangles.map(r=>r.y+r.height))+24-north);
 },[bodies]);
 const bodyPicture=useMemo(()=>picture(canvas=>{
  const paint=Skia.Paint();paint.setAntiAlias(true);paint.setStrokeJoin(StrokeJoin.Round);
  for(const b of bodies){const p=b.palette,o=b.outbreak;
   const stroke=(width:number,alpha:number,color=p.body)=>{paint.setStyle(PaintStyle.Stroke);paint.setStrokeWidth(width);paint.setColor(Skia.Color(color));paint.setAlphaf(alpha);canvas.drawPath(b.path,paint);};
   stroke(12,.09);stroke(5,.18);paint.setStyle(PaintStyle.Fill);paint.setColor(Skia.Color(p.body));paint.setAlphaf(o.status==='cleared'?.12:o.lifecycle==='remnant'?.03+.25*Math.min(1,o.strength/.25):.28);canvas.drawPath(b.path,paint);stroke(1.8,.8,p.rim);
   if(o.status==='withering'||visited.has(o.id)){const effect=Skia.PathEffect.MakeDash(o.status==='withering'?[1,5]:[5,2],0);paint.setPathEffect(effect);stroke(3,.8,visited.has(o.id)?'#30ddc7':'#fff2cf');paint.setPathEffect(null);effect.dispose();}
  }paint.dispose();
 },bounds),[bodies,visited,bounds]);
 const detailed=useMemo(()=>{
  if(viewport.zoom<12.5)return [];
  const [w,s,e,n]=viewport.bounds;
  return bodies.filter(b=>{const xs=b.outbreak.ring.map(p=>p[0]),ys=b.outbreak.ring.map(p=>p[1]);return Math.max(...xs)>=w&&Math.min(...xs)<=e&&Math.max(...ys)>=s&&Math.min(...ys)<=n;}).sort((a,b)=>Math.hypot(a.outbreak.ring[0][0]-viewport.center[0],a.outbreak.ring[0][1]-viewport.center[1])-Math.hypot(b.outbreak.ring[0][0]-viewport.center[0],b.outbreak.ring[0][1]-viewport.center[1])).slice(0,24).map(b=>({...b,membranes:richerMembranes(b.center,b.radius,b.seed).map(m=>({membrane:m,picture:membranePicture(m,b.palette)}))}));
 },[bodies,viewport]);
 const interiors=useDerivedValue(()=>{
  const recorder=Skia.PictureRecorder(),canvas=recorder.beginRecording(bounds);
  for(const b of detailed){canvas.save();canvas.clipPath(b.path,ClipOp.Intersect,true);
   for(const {membrane:m,picture} of b.membranes){const v=membraneMotion(m,clock.value,b.seed);canvas.save();canvas.concat([v.sx,v.kx,m.center[0]+v.dx,v.ky,v.sy,m.center[1]+v.dy,0,0,1]);canvas.drawPicture(picture);canvas.restore();}
   canvas.restore();
  }
  const result=recorder.finishRecordingAsPicture();recorder.dispose();return result;
 });
 const matrix=useDerivedValue(()=>{const c=camera.value;const p=growthPoint(c.center),scale=(c.scaleFactor??1)*512*2**c.zoom/(2*Math.PI*R*C),a=c.bearing*Math.PI/180,cos=Math.cos(a)*scale,sin=Math.sin(a)*scale;return [cos,sin,c.anchor[0]-cos*p[0]-sin*p[1],-sin,cos,c.anchor[1]+sin*p[0]-cos*p[1],0,0,1];});
 if(!active)return null;
 return <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}><Group matrix={matrix}><Picture picture={bodyPicture}/><Picture picture={interiors}/></Group></Canvas>;
}
