import {useEffect,useRef,useState} from 'react';
import {Animated,AppState,StyleSheet,Text} from 'react-native';
import type {WorldView} from '@sporeward/protocol';

/** Celebrate observed transitions, never historical cleared areas on first load. */
export function CleanupFeedback({world,top,hidden=false}:{world:WorldView|null;top:number;hidden?:boolean}){
 const previous=useRef<Map<string,string>|null>(null);
 const [message,setMessage]=useState('');
 const opacity=useRef(new Animated.Value(0)).current;
 useEffect(()=>{
  if(!world){previous.current=null;opacity.stopAnimation();opacity.setValue(0);setMessage('');return;}
  const next=new Map(world.outbreaks.map(o=>[o.id,o.status]));
  const cleared=world.outbreaks.filter(o=>o.status==='cleared'&&previous.current?.has(o.id)&&previous.current.get(o.id)!=='cleared');
  previous.current=next;
  if(!cleared.length||AppState.currentState!=='active')return;
  setMessage(cleared.length===1?`${cleared[0].name} cleared`:`${cleared.length} outbreaks cleared`);
  opacity.stopAnimation();opacity.setValue(0);
  Animated.sequence([
   Animated.timing(opacity,{toValue:1,duration:250,useNativeDriver:true}),
   Animated.delay(4500),
   Animated.timing(opacity,{toValue:0,duration:500,useNativeDriver:true}),
  ]).start(({finished})=>{if(finished)setMessage('');});
 },[world,opacity]);
 useEffect(()=>()=>opacity.stopAnimation(),[opacity]);
 if(!message||hidden)return null;
 return <Animated.View pointerEvents="none" accessibilityLiveRegion="polite" style={[styles.notice,{top,opacity,transform:[{translateY:opacity.interpolate({inputRange:[0,1],outputRange:[8,0]})}]}]}>
  <Text style={styles.title}>✦ OVERGROWTH CLEARED</Text>
  <Text style={styles.body}>{message}</Text>
  <Text style={styles.caption}>A little more room to roam.</Text>
 </Animated.View>;
}
const styles=StyleSheet.create({notice:{position:'absolute',left:16,right:16,padding:18,borderRadius:20,backgroundColor:'#153d32f5',borderColor:'#9be9b4',borderWidth:1,gap:6},title:{color:'#9be9b4',fontSize:13,fontWeight:'800',letterSpacing:1.5},body:{color:'#eef8ef',fontSize:21,fontWeight:'700'},caption:{color:'#c5dccd',fontSize:15}});
