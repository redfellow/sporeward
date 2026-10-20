import {Canvas,Circle,Line,Path,vec} from '@shopify/react-native-skia';
/** Explicit geometry avoids platform font bearings and arrow baseline differences. */
export function MapControlIcon({kind}:{kind:'north'|'travel'|'center'}){
 return <Canvas style={{width:28,height:28}} pointerEvents="none">
  {kind==='center'?<>
   <Circle cx={14} cy={14} r={7} color="#e9f6ef" style="stroke" strokeWidth={1.5}/>
   <Circle cx={14} cy={14} r={2} color="#9eeabb"/>
   {[[14,2,14,7],[14,21,14,26],[2,14,7,14],[21,14,26,14]].map(([x,y,x2,y2],i)=><Line key={i} p1={vec(x,y)} p2={vec(x2,y2)} color="#e9f6ef" strokeWidth={1.5}/>)}
  </>:<>
   <Path path={kind==='north'?'M14 3 L23 24 L14 19 Z':'M22 4 L17 25 L12 16 L3 11 Z'} color="#a3edbf"/>
   <Path path={kind==='north'?'M14 3 L5 24 L14 19 Z':'M22 4 L12 16 L3 11 Z'} color="#f0faf3"/>
  </>}
 </Canvas>;
}
