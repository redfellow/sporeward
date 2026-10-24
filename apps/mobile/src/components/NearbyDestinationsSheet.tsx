import {memo,useMemo,useState} from 'react';
import {Pressable,SectionList,StyleSheet,Text,View} from 'react-native';
import type {DestinationFocus} from './destination-focus';
import {nearbyDestinations,destinationKey,type NearbyContext,type NearbyFilter} from './nearby-destinations';

type Props={context:NearbyContext;status:string;height:number;onClose:()=>void;onSelect:(focus:DestinationFocus)=>void};
const FILTERS=[['all','All'],['outbreak','Outbreaks'],['lab','Field Labs']] as const;

/** A UI sheet only: no map, GPS, network, recording or pin ownership. */
export const NearbyDestinationsSheet=memo(function NearbyDestinationsSheet({context,status,height,onClose,onSelect}:Props){
 const [filter,setFilter]=useState<NearbyFilter>('all');
 const list=useMemo(()=>nearbyDestinations(context,filter),[context,filter]);
 return <View accessibilityLabel="Nearby destinations" style={[styles.sheet,{height}]}>
  <View style={styles.heading}>
   <View style={{flex:1}}><Text style={styles.eyebrow}>CHOOSE YOUR DETOUR</Text><Text style={styles.title}>Nearby destinations</Text></View>
   <Pressable accessibilityRole="button" accessibilityLabel="Close nearby destinations" onPress={onClose} style={styles.button}><Text style={styles.label}>Close</Text></Pressable>
  </View>
  <SectionList
   style={{flex:1}} sections={list.sections} keyExtractor={item=>destinationKey(item.focus)}
   stickySectionHeadersEnabled={false} initialNumToRender={6} maxToRenderPerBatch={6} windowSize={5}
   contentContainerStyle={styles.content}
   ListHeaderComponent={<View style={styles.intro}>
    <View style={styles.filters}>{FILTERS.map(([value,label])=><Pressable key={value} accessibilityRole="button" accessibilityState={{selected:filter===value}} onPress={()=>setFilter(value)} style={[styles.filter,filter===value&&styles.chosen]}><Text style={styles.label}>{label}</Text></Pressable>)}</View>
    <Text style={styles.body}>Loaded world · {list.count} {list.count===1?'destination':'destinations'}</Text>
    <Text style={styles.body}>{list.located?'Available first · nearest within each group':'Available first · name order; no recent location'}</Text>
    <Text style={styles.note}>{list.located?'Straight-line to contact area · not road distance or a reachable-route guarantee':'Distance unavailable · proximity ordering needs a location at most two minutes old'}</Text>
    {context.world&&<Text style={styles.note}>Last world update {new Date(context.world.serverTime).toLocaleString()}</Text>}
    {!!status&&<Text style={styles.note} accessibilityLiveRegion="polite">{status}</Text>}
   </View>}
   ListEmptyComponent={<Text style={styles.empty}>{list.empty}</Text>}
   renderSectionHeader={({section})=><Text style={styles.section}>{section.title}</Text>}
   renderItem={({item})=><Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.name} ${item.focus.kind==='lab'?'Field Lab':'outbreak'} details, ${item.status}`} onPress={()=>onSelect(item.focus)} style={styles.row}>
    <Text style={styles.type}>{item.focus.kind==='lab'?'FIELD LAB':'OUTBREAK'}</Text>
    <Text style={styles.name}>{item.name}</Text>
    <Text style={styles.state}>{item.status}{item.availableAt?` · after ${new Date(item.availableAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`:''}</Text>
    {item.reward&&<Text style={styles.reward}>{item.reward}</Text>}
    {item.effort&&<Text style={styles.note}>{item.effort}</Text>}
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
 content:{paddingHorizontal:12,paddingBottom:12},intro:{gap:6,paddingBottom:10},filters:{flexDirection:'row',flexWrap:'wrap',gap:6},
 button:{minHeight:44,paddingHorizontal:12,justifyContent:'center',borderRadius:10,backgroundColor:'#284c3a'},label:{color:'#eef8ef',fontSize:13,fontWeight:'700'},filter:{minHeight:44,paddingHorizontal:12,justifyContent:'center',backgroundColor:'#1c3a2e',borderRadius:10,borderWidth:1,borderColor:'#38594f'},chosen:{backgroundColor:'#35593f',borderColor:'#9be9b4'},
 body:{color:'#d4e3d8',fontSize:13,lineHeight:19},note:{color:'#b9cfbf',fontSize:12,lineHeight:18},empty:{color:'#d4e3d8',fontSize:15,lineHeight:22,paddingVertical:18},section:{color:'#9be9b4',fontSize:13,fontWeight:'700',paddingTop:12,paddingBottom:8},
 row:{padding:12,gap:4,borderRadius:12,marginBottom:8,backgroundColor:'#1c3a2e',minHeight:44},type:{color:'#a9beaf',fontSize:9,fontWeight:'700',letterSpacing:1},name:{color:'#eef8ef',fontSize:16,fontWeight:'700'},state:{color:'#eef8ef',fontSize:13},reward:{color:'#d7c4ff',fontSize:13,fontWeight:'700'},contact:{color:'#9be9b4',fontSize:12,lineHeight:18},distance:{color:'#e5d8ad',fontSize:12,lineHeight:18},details:{color:'#9be9b4',fontSize:12,fontWeight:'700',paddingTop:4},
});
