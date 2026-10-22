import {useEffect,useRef,useState} from 'react';
import {ClipOp,PaintStyle,Skia,TileMode,vec} from '@shopify/react-native-skia';
import {Directory,File,Paths} from 'expo-file-system';
import {GeoJSONSource,ImageSource,Layer} from '@maplibre/maplibre-react-native';
import {resistanceContour,resistanceHazeStops,resistanceTint,resistanceContourColour} from '@sporeward/rendering';
import type {WorldView,Coordinate} from '@sporeward/protocol';
import {growthPoint,pathFor} from './RicherOverlay';

type Raster={centre:Coordinate;url:string;coordinates:[Coordinate,Coordinate,Coordinate,Coordinate]};
/** One static geographic field, clipped out of outbreak interiors and below roads. */
export function ResistanceLayer({world,bright,beforeId}:{world:WorldView|null;bright:boolean;beforeId?:string}){
 const [raster,setRaster]=useState<Raster|null>(null);
 const [directory]=useState(()=>new Directory(Paths.cache,'resistance-'+Math.random().toString(36).slice(2)));
 const files=useRef<File[]>([]);
 const directoryRevision=useRef(0);
 // World polling changes object identity even when the visible field is identical.
 const rasterKey=JSON.stringify([bright,world?.resistance?.centre,world?.resistance?.radiusMetres,Math.round((world?.resistance?.centreResistance??0)*1000)/1000,world?.outbreaks.map(o=>o.ring)]);
 const renderedKey=useRef<string|null>(null);
 useEffect(()=>{const revision=++directoryRevision.current;return()=>{setTimeout(()=>{if(directoryRevision.current!==revision)return;try{if(directory.exists)directory.delete();}catch{}},5000);};},[directory]);
 useEffect(()=>{
  if(renderedKey.current===rasterKey)return;
  renderedKey.current=rasterKey;
  const zone=world?.resistance;
  if(!zone?.centre||zone.centreResistance<=0){setRaster(null);return;}
  directory.create({intermediates:true,idempotent:true});
  try{
   const [cx,cy]=growthPoint(zone.centre),r=zone.radiusMetres,size=1024,scale=size/(2*r),amount=zone.centreResistance/(1+zone.centreResistance);
   const surface=Skia.Surface.Make(size,size);if(!surface)throw new Error('Resistance surface unavailable');
   const canvas=surface.getCanvas();canvas.clear(Skia.Color('transparent'));canvas.scale(scale,scale);canvas.translate(r-cx,r-cy);
   for(const outbreak of world?.outbreaks??[]){const path=pathFor(outbreak.ring.map(growthPoint));canvas.clipPath(path,ClipOp.Difference,true);path.dispose();}
   const paint=Skia.Paint();paint.setAntiAlias(true);
   const shader=Skia.Shader.MakeRadialGradient(vec(cx,cy),r,resistanceHazeStops.map(([,alpha])=>Skia.Color(resistanceTint(bright,alpha*amount))),resistanceHazeStops.map(([stop])=>stop),TileMode.Clamp);
   paint.setShader(shader);canvas.drawRect(Skia.XYWHRect(cx-r,cy-r,2*r,2*r),paint);paint.setShader(null);paint.setStyle(PaintStyle.Stroke);
   for(let band=0;band<6;band++){
    const points:Coordinate[]=resistanceContour(r,band).map(([x,y])=>[cx+x,cy+y]);
    const path=pathFor(points,true);paint.setColor(Skia.Color(resistanceContourColour(bright,amount*(.65-band*.055))));paint.setStrokeWidth(r/500);canvas.drawPath(path,paint);path.dispose();
   }
   const image=surface.makeImageSnapshot(),file=new File(directory,Date.now()+'-'+Math.random().toString(36).slice(2)+'.png');file.write(image.encodeToBytes());
   files.current.push(file);while(files.current.length>8){try{files.current.shift()!.delete();}catch{}}
   const earth=6378137,c=Math.cos(61.495*Math.PI/180),y0=Math.log(Math.tan(Math.PI/4+61.495*Math.PI/360));
   const coordinate=(x:number,y:number):Coordinate=>[23.795+x/(earth*c)*180/Math.PI,(2*Math.atan(Math.exp(y0-y/(earth*c)))-Math.PI/2)*180/Math.PI];
   setRaster({centre:[...zone.centre],url:file.uri,coordinates:[coordinate(cx-r,cy-r),coordinate(cx+r,cy-r),coordinate(cx+r,cy+r),coordinate(cx-r,cy+r)]});
   image.dispose();shader.dispose();paint.dispose();surface.dispose();
  }catch{setRaster(null);}
 },[rasterKey,world,bright,directory]);
 if(!world?.resistance?.centre||!raster?.centre||raster.centre[0]!==world.resistance.centre[0]||raster.centre[1]!==world.resistance.centre[1])return null;
 return <><ImageSource id="personal-resistance-field" url={raster.url} coordinates={raster.coordinates}><Layer id="personal-resistance-haze" type="raster" beforeId={beforeId} paint={{'raster-opacity':1,'raster-fade-duration':0}}/></ImageSource><GeoJSONSource id="personal-resistance-centre" data={{type:'Feature',properties:{},geometry:{type:'Point',coordinates:world!.resistance!.centre!}}}><Layer id="personal-resistance-centre-mark" type="circle" beforeId={beforeId} paint={{'circle-radius':6,'circle-color':'transparent','circle-stroke-color':bright?'#364e76':'#d3dcef','circle-stroke-width':1.2}}/></GeoJSONSource></>;
}
