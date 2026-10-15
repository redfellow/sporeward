import {claimLegacyActivities,legacyActivityCount} from '../recording/store';
import {useEffect,useState,useRef} from 'react';
import {Alert,Pressable,Text,TextInput,View,StyleSheet} from 'react-native';
import {savedSession,signIn,signOut,redeemInvite,type TesterSession} from '../server/session';
import {loadCredentials} from '../server/credentials';
export function TesterAccount({disabled,onChanged}:{disabled:boolean;onChanged:()=>void}){
 const [session,setSession]=useState<TesterSession|null>(null),[busy,setBusy]=useState(false),[joining,setJoining]=useState(false),[status,setStatus]=useState('Sign in to your tester account.');
 const [legacyCount,setLegacyCount]=useState(0);
 useEffect(()=>{void legacyActivityCount().then(setLegacyCount).catch(()=>{});},[]);
 const form=useRef({username:'',password:'',name:'',invite:''});
 useEffect(()=>{let alive=true;void savedSession().then(s=>{if(alive)setSession(s);}).catch(()=>{if(alive)setStatus('Could not read the saved account session.');});return()=>{alive=false;};},[]);
 async function submit(logout=false){if(busy||disabled)return;setBusy(true);const {username,password,name,invite}=form.current;
  try{const c=await loadCredentials();if(!c)throw new Error('Configure the test gateway connection first.');
   if(logout){await signOut(c);setSession(null);setStatus('Signed out.');}
   else{const next=joining?await redeemInvite(c,invite.trim(),username.trim(),name.trim(),password):await signIn(c,username.trim(),password);setSession(next);setStatus('Signed in.');form.current={username:'',password:'',name:'',invite:''};}
   onChanged();
  }catch(e){setStatus(e instanceof Error?e.message:'Account request failed.');}finally{setBusy(false);}
 }
 async function transfer(){
  if(disabled||busy||!session?.tester.playerId||session.tester.playerId===session.tester.id)return;
  Alert.alert('Transfer earlier outings?',`Link ${legacyCount} earlier recordings on this phone to ${session.tester.name}? Their GPS data, upload receipts and original IDs will be preserved.`,[{text:'Cancel'},{text:'Transfer',onPress:()=>{setBusy(true);void claimLegacyActivities(session.tester.id).then(count=>{setLegacyCount(0);setStatus(`${count} earlier outings linked.`);onChanged();}).catch(()=>setStatus('Could not transfer outings. Original recordings are preserved.')).finally(()=>setBusy(false));}}]);
 }
 const button=(label:string,action:()=>void)=><Pressable accessibilityRole="button" disabled={disabled||busy} onPress={action} style={[styles.button,(disabled||busy)&&{opacity:.5}]}><Text style={styles.label}>{label}</Text></Pressable>;
 return <View style={styles.card}><Text style={styles.title}>Tester account</Text>
  {session?<><Text style={styles.text}>{session.tester.name} · @{session.tester.username}</Text>{session.tester.playerId&&session.tester.playerId!==session.tester.id&&legacyCount>0&&button(`Link ${legacyCount} earlier outings`,()=>void transfer())}{button('Sign out',()=>void submit(true))}</>:<>
   <TextInput accessibilityLabel="Account username" placeholder="Username" placeholderTextColor="#9ab4a4" autoCapitalize="none" autoCorrect={false} defaultValue="" onChangeText={text=>{form.current.username=text;}} editable={!busy&&!disabled} style={styles.input}/>
   <TextInput accessibilityLabel="Account password" placeholder="Password" placeholderTextColor="#9ab4a4" secureTextEntry defaultValue="" onChangeText={text=>{form.current.password=text;}} editable={!busy&&!disabled} style={styles.input}/>
   {joining&&<><TextInput accessibilityLabel="Tester display name" placeholder="Display name" placeholderTextColor="#9ab4a4" defaultValue="" onChangeText={text=>{form.current.name=text;}} style={styles.input}/><TextInput accessibilityLabel="Tester invite" placeholder="Invite code" placeholderTextColor="#9ab4a4" autoCapitalize="none" autoCorrect={false} defaultValue="" onChangeText={text=>{form.current.invite=text;}} style={styles.input}/></>}
   {button(busy?'Connecting…':joining?'Join tester group':'Sign in',()=>void submit())}{button(joining?'Already have an account':'Use an invite',()=>{form.current.name='';form.current.invite='';setJoining(!joining);})}
  </>}
  <Text style={styles.text} accessibilityLiveRegion="polite">{disabled?'Finish the current outing before switching accounts.':status}</Text>
 </View>;
}
const styles=StyleSheet.create({card:{padding:18,borderRadius:18,backgroundColor:'#1c3a2e',gap:12},title:{fontSize:21,fontWeight:'700',color:'#eef8ef'},text:{color:'#b9cfbf',fontSize:15},input:{padding:14,borderRadius:12,backgroundColor:'#10271f',color:'#eef8ef',fontSize:16},button:{padding:14,borderRadius:12,backgroundColor:'#284c3a'},label:{color:'#eef8ef',fontWeight:'600',fontSize:16}});
