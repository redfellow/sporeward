import {useEffect,useState} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import type {TesterScores as Scores} from '@sporeward/protocol';
import {loadCredentials} from '../server/credentials';
import {fetchScores} from '../server/world';
export function TesterScores(){
 const [scores,setScores]=useState<Scores|null>(null),[player,setPlayer]=useState<string|null>(null),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
 useEffect(()=>{let alive=true;void loadCredentials().then(async c=>{if(!alive)return;setPlayer(c?.playerId??null);if(!c?.session)return;try{const result=await fetchScores(c);if(alive)setScores(result);}catch{if(alive)setStatus('Scores unavailable while offline.');}}).catch(()=>{});return()=>{alive=false;};},[]);
 async function refresh(){if(busy)return;setBusy(true);try{const c=await loadCredentials();if(!c?.session)throw new Error('Sign in to compare tester scores.');setPlayer(c.playerId??null);setScores(await fetchScores(c));setStatus('');}catch(e){setStatus(e instanceof Error?e.message:'Scores unavailable.');}finally{setBusy(false);}}
 return <View style={styles.card}><Text style={styles.title}>Tester standings</Text><Text style={styles.body}>Confirmed points in this test world</Text>
  {scores?.entries.map(e=><View key={e.playerId} style={[styles.row,e.playerId===player&&styles.you]}><Text style={styles.name}>{e.rank}. {e.name}{e.playerId===player?' · you':''}</Text><Text style={styles.points}>{e.points}</Text></View>)}
  {scores&&!scores.entries.length&&<Text style={styles.body}>The first outing can put you on the board.</Text>}
  <Text style={styles.body} accessibilityLiveRegion="polite">{status||(!player?'Sign in to join the tester board.':'')}</Text>
  <Pressable accessibilityRole="button" disabled={busy} onPress={()=>void refresh()} style={styles.button}><Text style={styles.name}>{busy?'Updating…':'Refresh scores'}</Text></Pressable>
 </View>;
}
const styles=StyleSheet.create({card:{padding:18,borderRadius:18,backgroundColor:'#1c3a2e',gap:12},title:{color:'#eef8ef',fontSize:21,fontWeight:'700'},body:{color:'#b9cfbf',fontSize:14,lineHeight:20},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:10,gap:12,borderRadius:10},you:{backgroundColor:'#354034'},name:{color:'#eef8ef',fontSize:16,flexShrink:1},points:{color:'#c0a2ff',fontSize:21,fontWeight:'800'},button:{padding:14,borderRadius:12,backgroundColor:'#284c3a'}});
