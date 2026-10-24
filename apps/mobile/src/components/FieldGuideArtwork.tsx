import {useEffect,useMemo,useState} from 'react';
import {AppState,StyleSheet,View} from 'react-native';
import {Canvas,Circle,Group,ImageSVG,Path,RadialGradient,Skia,vec} from '@shopify/react-native-skia';
import {guideSpecimenSvg,mapPalettes,resistanceContour,resistanceContourColour,resistanceHazeStops,resistanceTint,surveyStationSvg,type GuideState} from '@sporeward/rendering';

function VectorArtwork({source,height=180}:{source:string;height?:number}){
 const [width,setWidth]=useState(320);
 const svg=useMemo(()=>Skia.SVG.MakeFromString(source),[source]);
 useEffect(()=>()=>svg?.dispose(),[svg]);
 return <View onLayout={event=>setWidth(Math.max(1,event.nativeEvent.layout.width))} style={{height}}><Canvas style={StyleSheet.absoluteFill}>{svg&&<ImageSVG svg={svg} x={0} y={0} width={width} height={height}/>}</Canvas></View>;
}

/** Only the requested specimen owns a timer; no real world or map is involved. */
export function OutbreakGuideArtwork({state,bright,motion}:{state:GuideState;bright:boolean;motion:boolean}){
 const [time,setTime]=useState(0);
 useEffect(()=>{
  if(!motion){setTime(0);return;}
  const started=Date.now();const timer=setInterval(()=>{if(AppState.currentState==='active')setTime((Date.now()-started)/1000);},125);
  return()=>clearInterval(timer);
 },[motion]);
 const source=useMemo(()=>guideSpecimenSvg(state,bright,time),[state,bright,time]);
 return <VectorArtwork source={source}/>;
}

export function LabGuideArtwork({collected,bright}:{collected:boolean;bright:boolean}){
 const source=useMemo(()=>surveyStationSvg(collected,1,bright),[collected,bright]);
 return <VectorArtwork source={source} height={130}/>;
}

/** Shared 227-degree field and contours; amounts illustrate recovery, not an offer. */
export function ResistanceGuideArtwork({bright,amount}:{bright:boolean;amount:number}){
 const map=mapPalettes[bright?'day':'night'];
 const contours=useMemo(()=>Array.from({length:6},(_,band)=>{
  const points=resistanceContour(75,band),builder=Skia.PathBuilder.Make();points.forEach(([x,y],index)=>index?builder.lineTo(80+x,70+y):builder.moveTo(80+x,70+y));builder.close();const path=builder.detach();builder.dispose();return path;
 }),[]);
 useEffect(()=>()=>contours.forEach(path=>path.dispose()),[contours]);
 return <Canvas style={{width:160,height:140,alignSelf:'center',backgroundColor:map.ground}}>
  <Circle cx={80} cy={70} r={78}><RadialGradient c={vec(80,70)} r={78} colors={resistanceHazeStops.map(([,alpha])=>resistanceTint(bright,alpha*amount))} positions={resistanceHazeStops.map(([position])=>position)}/></Circle>
  {contours.map((path,index)=><Path key={index} path={path} color={resistanceContourColour(bright,amount*(.65-index*.055))} style="stroke" strokeWidth={.6}/>)}
  <Group color={map.road}><Path path="M0 105L160 35M48 0L110 140" style="stroke" strokeWidth={3}/></Group>
  <Circle cx={80} cy={70} r={4} color={bright?'#364e76':'#d3dcef'} style="stroke" strokeWidth={1}/>
 </Canvas>;
}
