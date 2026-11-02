import {memo} from 'react';
import {FlatList,Pressable,StyleSheet,Text,View} from 'react-native';
import type {DestinationSummary} from './destination-focus';
import type {ResistanceOverview} from './resistance-overview';

type Props={overview:ResistanceOverview;height:number;onClose:()=>void;onShowArea:()=>void;onSelectLab:(id:string)=>void};

/** A UI sheet only: no map, GPS, network, recording, scoring or pin ownership. Candidate labs are virtualized. */
export const ResistanceOverviewSheet=memo(function ResistanceOverviewSheet({overview,height,onClose,onShowArea,onSelectLab}:Props){
 const {labs}=overview;
 return <View accessibilityLabel="Personal Resistance overview" style={[styles.sheet,{height}]}>
  <View style={styles.heading}>
   <View style={{flex:1}}><Text style={styles.eyebrow}>YOUR FIELD</Text><Text style={styles.title}>Resistance</Text></View>
   <Pressable accessibilityRole="button" accessibilityLabel="Close Resistance overview" onPress={onClose} style={styles.button}><Text style={styles.label}>Close</Text></Pressable>
  </View>
  <FlatList
   style={{flex:1}} data={labs.candidates} keyExtractor={item=>item.focus.id}
   initialNumToRender={6} maxToRenderPerBatch={6} windowSize={5} contentContainerStyle={styles.content}
   ListHeaderComponent={<View style={styles.intro}>
    {!!overview.qualifier&&<Text style={styles.warning} accessibilityLiveRegion="polite">{overview.qualifier}</Text>}
    <Text style={styles.headline}>{overview.headline}</Text>
    {overview.explanation.map(line=><Text key={line} style={styles.body}>{line}</Text>)}
    {!!overview.spatialNote&&<Text style={styles.note}>{overview.spatialNote}</Text>}
    {!!overview.area&&<Pressable accessibilityRole="button" accessibilityLabel="Show affected area on the map" onPress={onShowArea} style={styles.button}><Text style={styles.label}>Show affected area</Text></Pressable>}
    {overview.recovery.map(line=><Text key={line} style={styles.body}>{line}</Text>)}
    <Text style={styles.section}>Available Field Labs</Text>
    <Text style={styles.note}>{labs.coverage}</Text>
    <Text style={styles.note}>{labs.located?'Nearest first. ':'Name order; no recent location. '}{labs.distanceNote}</Text>
   </View>}
   ListEmptyComponent={labs.empty?<Text style={styles.empty}>{labs.empty}</Text>:null}
   renderItem={({item}:{item:DestinationSummary})=><Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.name} details, ${item.status}`} onPress={()=>onSelectLab(item.focus.id)} style={styles.row}>
    <Text style={styles.type}>FIELD LAB</Text>
    <Text style={styles.name}>{item.name}</Text>
    <Text style={styles.state}>{item.status}</Text>
    {item.reward&&<Text style={styles.reward}>{item.reward}</Text>}
    {item.contact&&<Text style={styles.contact}>{item.contact}</Text>}
    <Text style={styles.distance}>{item.distance}</Text>
    <Text style={styles.details}>View details →</Text>
   </Pressable>}
  />
 </View>;
});

const styles=StyleSheet.create({
 sheet:{backgroundColor:'#10271ff8',borderRadius:18,borderWidth:1,borderColor:'#58755f',overflow:'hidden'},
 heading:{flexDirection:'row',alignItems:'center',padding:12,gap:8},eyebrow:{color:'#9be9b4',fontSize:9,fontWeight:'800',letterSpacing:1},title:{color:'#eef8ef',fontWeight:'800',fontSize:18},
 content:{paddingHorizontal:12,paddingBottom:12},intro:{gap:8,paddingBottom:10,alignItems:'flex-start'},
 button:{minHeight:44,paddingHorizontal:12,justifyContent:'center',borderRadius:10,backgroundColor:'#284c3a'},label:{color:'#eef8ef',fontSize:13,fontWeight:'700'},
 headline:{color:'#eef8ef',fontSize:16,fontWeight:'700',lineHeight:22},body:{color:'#d4e3d8',fontSize:13,lineHeight:19},note:{color:'#b9cfbf',fontSize:12,lineHeight:18},warning:{color:'#e5d8ad',fontSize:12,lineHeight:18},
 empty:{color:'#d4e3d8',fontSize:15,lineHeight:22,paddingVertical:12},section:{color:'#9be9b4',fontSize:13,fontWeight:'700',paddingTop:8},
 row:{padding:12,gap:4,borderRadius:12,marginBottom:8,backgroundColor:'#1c3a2e',minHeight:44},type:{color:'#a9beaf',fontSize:9,fontWeight:'700',letterSpacing:1},name:{color:'#eef8ef',fontSize:16,fontWeight:'700'},state:{color:'#eef8ef',fontSize:13},reward:{color:'#d7c4ff',fontSize:13,fontWeight:'700'},contact:{color:'#9be9b4',fontSize:12,lineHeight:18},distance:{color:'#e5d8ad',fontSize:12,lineHeight:18},details:{color:'#9be9b4',fontSize:12,fontWeight:'700',paddingTop:4},
});
