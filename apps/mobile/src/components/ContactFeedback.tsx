import {memo} from 'react';
import {FlatList,Pressable,StyleSheet,Text,View} from 'react-native';
import {contactEntryText,contactKey,type ContactEntry,type Notice} from '../recording/contact-feedback';

export type ContactFeedbackView={rows:ContactEntry[];notice:Notice|null;status:string;qualified:boolean};
export function ContactNotice({notice,qualified,top}:{notice:Notice|null;qualified:boolean;top:number}){
 if(!notice)return null;
 const single=notice.entries.length===1?notice.entries[0]:null;
 return <View pointerEvents="none" accessibilityLiveRegion="polite" style={[styles.banner,{top}]}>
  <Text style={styles.eyebrow}>{single?.kind==='lab'?'FIELD LAB REACHED':single?'OUTBREAK REACHED':'CONTACTS RECORDED'}</Text>
  <Text style={styles.name}>{single?.name??`${notice.entries.length} destinations reached`}</Text>
  <Text style={styles.body}>{single?contactEntryText(single,qualified):'Open Recent contacts for individual results · estimates await validation'}</Text>
 </View>;
}
export const RecentContactsSheet=memo(function RecentContactsSheet({feedback,height,onClose}:{feedback:ContactFeedbackView;height:number;onClose:()=>void}){
 return <View style={[styles.sheet,{height}]} accessibilityLabel="Recent contacts">
  <View style={styles.heading}><View style={{flex:1}}><Text style={styles.eyebrow}>THIS OUTING</Text><Text style={styles.title}>Recent contacts</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close recent contacts" onPress={onClose} style={styles.close}><Text style={styles.label}>Close</Text></Pressable></View>
  <FlatList style={{flex:1}} data={feedback.rows} keyExtractor={contactKey} initialNumToRender={6} maxToRenderPerBatch={6} windowSize={5} contentContainerStyle={styles.content}
   ListHeaderComponent={<View style={styles.intro}><Text style={styles.note}>Recorded contact times · newest first. A contact is not a guaranteed award.</Text>{!!feedback.status&&<Text style={styles.note} accessibilityLiveRegion="polite">{feedback.status}</Text>}</View>}
   renderItem={({item})=><View style={styles.row}><Text style={styles.eyebrow}>{item.kind==='lab'?'FIELD LAB':'OUTBREAK'} · {new Date(item.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</Text><Text style={styles.name}>{item.name}</Text><Text style={styles.body}>{contactEntryText(item,feedback.qualified)}</Text></View>}
  />
 </View>;
});
const styles=StyleSheet.create({
 banner:{position:'absolute',left:12,right:12,padding:14,borderRadius:16,backgroundColor:'#123c30f8',borderWidth:1,borderColor:'#9be9b4',gap:5},
 sheet:{backgroundColor:'#10271ff8',borderRadius:18,borderWidth:1,borderColor:'#58755f',overflow:'hidden'},heading:{flexDirection:'row',gap:8,alignItems:'center',padding:12},title:{color:'#eef8ef',fontSize:18,fontWeight:'800'},
 eyebrow:{color:'#9be9b4',fontSize:10,fontWeight:'800',letterSpacing:1},name:{color:'#eef8ef',fontSize:16,fontWeight:'700'},body:{color:'#d7c4ff',fontSize:13,lineHeight:19},note:{color:'#b9cfbf',fontSize:12,lineHeight:18},
 content:{paddingHorizontal:12,paddingBottom:12},intro:{gap:7,paddingBottom:12},row:{backgroundColor:'#1c3a2e',padding:12,borderRadius:12,marginBottom:8,gap:5},close:{backgroundColor:'#284c3a',borderRadius:10,minHeight:44,paddingHorizontal:12,justifyContent:'center'},label:{color:'#eef8ef',fontSize:13,fontWeight:'700'},
});
