import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import type {EncounterRecap,ActivityReceipt} from '@sporeward/protocol';
import type {Activity} from '../recording/store';
import {ActivityUpload} from './ActivityUpload';
export function OutingRecap({activity,distance,elapsed,recap,provisional,touched,onMap,onUploaded}:{activity:Activity;distance:number;elapsed:string;recap:EncounterRecap|null;provisional:number;touched:number;onMap:()=>void;onUploaded:(receipt:ActivityReceipt)=>void}){
 const count=recap?recap.encounters.filter(e=>e.accepted).length:touched;
 const points=recap?recap.confirmedVisitPoints+recap.confirmedCleanupPoints:provisional;
 return <ScrollView contentContainerStyle={styles.content}>
  <Text style={styles.eyebrow}>OUTING COMPLETE</Text><Text style={styles.title}>Your outing</Text>
  <Text style={styles.body}>{new Date(activity.started).toLocaleString()}</Text>
  <View style={styles.card}><Text style={styles.score}>{points} pts</Text><Text style={styles.body}>{recap?'Confirmed':'Provisional · confirming automatically'}</Text>
   <View style={styles.row}><Text style={styles.metric}>{(distance/1000).toFixed(2)} km</Text><Text style={styles.metric}>{elapsed}</Text></View>
   <Text style={styles.body}>{count} {recap?(count===1?'outbreak helped':'outbreaks helped'):(count===1?'outbreak contact':'outbreak contacts')}</Text>
   {recap&&<Text style={styles.body}>{recap.confirmedVisitPoints} from visits · {recap.confirmedCleanupPoints} from cleanup</Text>}
   {!!recap?.pendingCleanupPoints&&<View style={styles.pending}><Text style={styles.metric}>+{recap.pendingCleanupPoints} possible cleanup points</Text><Text style={styles.body}>Your cleaning is still working. Another visit may change who earns the finish.</Text></View>}
  </View>
  {recap?.encounters.map(e=><View key={e.outbreakId} style={styles.encounter}><Text style={styles.metric}>{e.name}</Text><Text style={styles.body}>{e.accepted?`${e.visitPoints+e.cleanupPoints} points${e.cleanupPoints?' · cleanup bonus':''}`:e.reason==='cooldown'?'Already visited recently':e.reason==='duplicate'?'Counted from another recording':e.reason==='ineligible'?'Activity did not qualify':'Contact outside the eligible window'}</Text></View>)}
  {!recap&&<Text style={styles.body}>Your recording is saved on this device. Your score confirms automatically when connected.</Text>}
  <ActivityUpload activity={activity} onUploaded={onUploaded} compact/>
  <Pressable accessibilityRole="button" style={styles.button} onPress={onMap}><Text style={styles.label}>Back to the world</Text></Pressable>
 </ScrollView>;
}
const styles=StyleSheet.create({content:{padding:24,gap:16,width:'100%',maxWidth:650,alignSelf:'center'},eyebrow:{color:'#9be9b4',fontWeight:'800',letterSpacing:2},title:{color:'#eef8ef',fontSize:30,fontWeight:'800'},body:{color:'#b9cfbf',fontSize:15,lineHeight:22},card:{padding:20,borderRadius:22,backgroundColor:'#1c3a2e',gap:12},score:{color:'#c0a2ff',fontSize:56,fontWeight:'800'},row:{flexDirection:'row',justifyContent:'space-between',gap:12},metric:{color:'#eef8ef',fontSize:18,fontWeight:'600'},pending:{padding:12,borderRadius:14,backgroundColor:'#354034',gap:6},encounter:{padding:14,borderRadius:14,backgroundColor:'#1c3a2e',gap:5},button:{padding:18,borderRadius:14,backgroundColor:'#9be9b4'},label:{color:'#10271f',fontWeight:'800',fontSize:17}});
