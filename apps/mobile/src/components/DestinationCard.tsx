import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import type {DestinationSummary} from './destination-focus';

export function DestinationCard({summary,maxHeight,onDetails,onShow,onClear,onHeight}:{summary:DestinationSummary;maxHeight:number;onDetails:()=>void;onShow:()=>void;onClear:()=>void;onHeight:(height:number)=>void}){
 const located=!!summary.ring;
 return <View style={[styles.card,{height:Math.min(maxHeight,230)}]} onLayout={event=>onHeight(Math.ceil(event.nativeEvent.layout.height))}>
  <ScrollView style={{flexShrink:1}} contentContainerStyle={styles.content} bounces={false}>
   <Text style={styles.eyebrow}>PINNED DESTINATION · {summary.focus.kind==='lab'?'FIELD LAB':'OUTBREAK'}</Text>
   <Text style={styles.title}>{summary.name}</Text>
   <Text style={styles.status}>{summary.status}{summary.availableAt?` · ${new Date(summary.availableAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`:''}</Text>
   {summary.reward&&<Text style={styles.reward}>{summary.reward}</Text>}
   {summary.effort&&<Text style={styles.body}>{summary.effort}</Text>}
   {summary.contact&&<Text style={styles.contact}>{summary.contact}</Text>}
   <Text style={styles.distance}>{summary.distance}</Text>
   <View style={styles.actions}>
    <Pressable accessibilityRole="button" accessibilityLabel="Show pinned destination on map" disabled={!located} onPress={onShow} style={[styles.button,!located&&styles.disabled]}><Text style={styles.label}>Show target</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Open pinned destination details" disabled={!located} onPress={onDetails} style={[styles.button,!located&&styles.disabled]}><Text style={styles.label}>Details</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Clear pinned destination" onPress={onClear} style={styles.button}><Text style={styles.label}>Clear</Text></Pressable>
   </View>
  </ScrollView>
 </View>;
}
const styles=StyleSheet.create({card:{borderRadius:18,backgroundColor:'#10271ff5',borderWidth:1,borderColor:'#d5c18b'},content:{padding:14,gap:7},eyebrow:{color:'#d5c18b',fontSize:9,fontWeight:'800',letterSpacing:1},title:{color:'#eef8ef',fontSize:18,fontWeight:'800'},status:{color:'#eef8ef',fontSize:14,fontWeight:'600'},reward:{color:'#d7c4ff',fontSize:14,fontWeight:'700'},body:{color:'#b9cfbf',fontSize:12,lineHeight:18},contact:{color:'#9be9b4',fontSize:12,lineHeight:18},distance:{color:'#e5d8ad',fontSize:12,lineHeight:18},actions:{flexDirection:'row',flexWrap:'wrap',gap:8,paddingTop:2},button:{minHeight:44,paddingHorizontal:12,paddingVertical:12,borderRadius:10,backgroundColor:'#284c3a',alignItems:'center',justifyContent:'center'},label:{color:'#eef8ef',fontSize:12,fontWeight:'700'},disabled:{opacity:.4}});
