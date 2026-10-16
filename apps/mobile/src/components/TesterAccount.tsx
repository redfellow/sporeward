import {claimLegacyActivities,legacyActivityCount} from '../recording/store';
import {useEffect,useState,useRef} from 'react';
import {Alert,AppState,Keyboard,KeyboardAvoidingView,Modal,Platform,Pressable,ScrollView,Text,TextInput,View,StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {savedSession,signIn,signOut,redeemInvite,type TesterSession} from '../server/session';
import {loadCredentials} from '../server/credentials';
const empty=()=>({username:'',password:'',name:'',invite:''});
export function TesterAccount({disabled,onChanged}:{disabled:boolean;onChanged:()=>void}){
 const [session,setSession]=useState<TesterSession|null>(null),[busy,setBusy]=useState(false),[joining,setJoining]=useState(false),[open,setOpen]=useState(false),[status,setStatus]=useState('Sign in to your tester account.');
 const [legacyCount,setLegacyCount]=useState(0),[formGeneration,setFormGeneration]=useState(0);
 const form=useRef(empty());
 const passwordInput=useRef<TextInput>(null);
 useEffect(()=>{void legacyActivityCount().then(setLegacyCount).catch(()=>{});},[]);
 useEffect(()=>{let alive=true;const refresh=()=>{void savedSession(true).then(s=>{if(alive){setSession(s);setStatus(s?(s.expiresAt<=Date.now()?'Session expired. Sign in again to upload; your offline outings stay with this account.':'Your outings and points are linked to this account.'):'Sign in to your tester account.');}}).catch(()=>{if(alive)setStatus('Could not read the saved account session.');});};refresh();const sub=AppState.addEventListener('change',state=>{if(state==='active')refresh();});return()=>{alive=false;sub.remove();};},[]);
 function show(join:boolean){if(disabled||busy)return;setJoining(join);form.current=empty();setFormGeneration(n=>n+1);setStatus(join?'Use the invitation provided by your tester group.':'Sign in to your tester account.');setOpen(true);}
 function close(){if(busy)return;Keyboard.dismiss();setOpen(false);form.current=empty();setFormGeneration(n=>n+1);}
 async function submit(logout=false){if(busy||disabled)return;setBusy(true);Keyboard.dismiss();
  try{const c=await loadCredentials();if(!c)throw new Error('Configure the test gateway connection first.');
   if(logout){await signOut(c);setSession(null);setStatus('Signed out.');}
   else{const {username,password,name,invite}=form.current;const next=joining?await redeemInvite(c,invite.trim(),username.trim(),name.trim(),password):await signIn(c,username.trim(),password);setSession(next);setStatus('Signed in.');form.current=empty();setFormGeneration(n=>n+1);setOpen(false);}
   onChanged();
  }catch(e){setStatus(e instanceof Error?e.message:'Account request failed.');}finally{setBusy(false);}
 }
 function transfer(){
  if(disabled||busy||!session?.tester.playerId||session.tester.playerId===session.tester.id)return;
  Alert.alert('Transfer earlier outings?',`Link ${legacyCount} earlier recordings on this phone to ${session.tester.name}? Their GPS data, upload receipts and original IDs will be preserved.`,[{text:'Cancel'},{text:'Transfer',onPress:()=>{setBusy(true);void claimLegacyActivities(session.tester.id).then(count=>{setLegacyCount(0);setStatus(`${count} earlier outings linked.`);onChanged();}).catch(()=>setStatus('Could not transfer outings. Original recordings are preserved.')).finally(()=>setBusy(false));}}]);
 }
 const button=(label:string,action:()=>void)=><Pressable accessibilityRole="button" disabled={disabled||busy} onPress={action} style={[styles.button,(disabled||busy)&&{opacity:.5}]}><Text style={styles.label}>{label}</Text></Pressable>;
 return <View style={styles.card}><Text style={styles.title}>Tester account</Text>
  {session?<><Text style={styles.text}>{session.tester.name} · @{session.tester.username}</Text>{session.tester.playerId&&session.tester.playerId!==session.tester.id&&legacyCount>0&&button(`Link ${legacyCount} earlier outings`,transfer)}{session.expiresAt<=Date.now()&&button('Sign in again',()=>show(false))}{button('Sign out',()=>void submit(true))}</>:<><Text style={styles.text}>Your account keeps your outings and points together.</Text>{button('Sign in',()=>show(false))}{button('Use an invite',()=>show(true))}</>}
  <Text style={styles.text} accessibilityLiveRegion="polite">{disabled?'Finish the current outing before switching accounts.':status}</Text>
  <Modal visible={open} animationType="slide" onRequestClose={close}>
   <SafeAreaView style={styles.modal}><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
    <ScrollView key={formGeneration} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
     <Text style={styles.title}>{joining?'Join the tester group':'Sign in to Sporeward'}</Text>
     <Text style={styles.text}>Use your personal tester account. Server gateway settings stay separate.</Text>
     <TextInput accessibilityLabel="Account username" placeholder="Username" placeholderTextColor="#9ab4a4" autoCapitalize="none" autoCorrect={false} autoComplete="off" importantForAutofill="no" defaultValue="" maxLength={40} onChangeText={username=>{form.current.username=username;}} returnKeyType="next" onSubmitEditing={()=>passwordInput.current?.focus()} editable={!busy&&!disabled} style={styles.input}/>
     <TextInput ref={passwordInput} accessibilityLabel="Account password" placeholder="Password" placeholderTextColor="#9ab4a4" secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="off" importantForAutofill="no" defaultValue="" maxLength={256} onChangeText={password=>{form.current.password=password;}} returnKeyType={joining?'next':'done'} onSubmitEditing={()=>{if(!joining)void submit();}} editable={!busy&&!disabled} style={styles.input}/>
     {joining&&<><TextInput accessibilityLabel="Tester display name" placeholder="Display name" placeholderTextColor="#9ab4a4" defaultValue="" maxLength={80} onChangeText={name=>{form.current.name=name;}} editable={!busy&&!disabled} style={styles.input}/><TextInput accessibilityLabel="Tester invite" placeholder="Invite code" placeholderTextColor="#9ab4a4" autoCapitalize="none" autoCorrect={false} defaultValue="" maxLength={128} onChangeText={invite=>{form.current.invite=invite;}} editable={!busy&&!disabled} style={styles.input}/></>}
     <Text style={styles.text} accessibilityLiveRegion="polite">{status}</Text>
     {button(busy?'Connecting…':joining?'Join tester group':'Sign in',()=>void submit())}{button('Cancel',close)}
    </ScrollView>
   </KeyboardAvoidingView></SafeAreaView>
  </Modal>
 </View>;
}
const styles=StyleSheet.create({card:{padding:18,borderRadius:18,backgroundColor:'#1c3a2e',gap:12},title:{fontSize:23,fontWeight:'700',color:'#eef8ef'},text:{color:'#b9cfbf',fontSize:15,lineHeight:22},input:{padding:16,borderRadius:12,backgroundColor:'#1c3a2e',color:'#eef8ef',fontSize:17},button:{padding:16,borderRadius:12,backgroundColor:'#284c3a'},label:{color:'#eef8ef',fontWeight:'600',fontSize:16},modal:{flex:1,backgroundColor:'#10271f'},content:{padding:24,gap:18,width:'100%',maxWidth:650,alignSelf:'center'}});
