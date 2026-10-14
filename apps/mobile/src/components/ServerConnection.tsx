import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { checkConnection, ConnectionError, SERVER_URL } from '../server/client';
import { forgetCredentials, loadCredentials, saveCredentials } from '../server/credentials';
export function ServerConnection({onChanged}:{onChanged?:()=>void}) {
 const [configured,setConfigured]=useState(false),[busy,setBusy]=useState(false),[open,setOpen]=useState(false);
 const [username,setUsername]=useState(''),[password,setPassword]=useState(''),[status,setStatus]=useState('No tester credentials saved.');
 useEffect(()=> {let alive=true;void loadCredentials().then(c=>{if(alive){setConfigured(!!c);setStatus(c?'Credentials saved. Connection not checked yet.':'No tester credentials saved.');}}).catch(()=>{if(alive)setStatus('Could not read saved credentials. Configure them again.');});return()=>{alive=false;};},[]);
 async function test() {
  setBusy(true);setStatus('Checking HTTPS connection…');
  try {const c=await loadCredentials();if(!c){setStatus('Configure tester credentials first.');return;}await checkConnection(c);onChanged?.();setStatus(`Connected · checked at ${new Date().toLocaleTimeString()}`);}
  catch(e){setStatus(e instanceof ConnectionError?e.message:'Could not read saved credentials. Configure them again.');}finally{setBusy(false);}
 }
 async function save() {
  setBusy(true);
  try {await saveCredentials({username:username.trim(),password});setConfigured(true);setStatus('Credentials saved. Use Check connection to verify them.');setPassword('');setUsername('');setOpen(false);onChanged?.();}
  catch(e){Alert.alert('Server settings',e instanceof ConnectionError?e.message:'Could not securely save credentials.');}finally{setBusy(false);}
 }
 async function forget() {
  setBusy(true);try{await forgetCredentials();setConfigured(false);setStatus('Tester credentials removed.');onChanged?.();setUsername('');setPassword('');}catch{setStatus('Could not remove saved credentials. Try again.');}finally{setBusy(false);}
 }
 const button=(label:string,onPress:()=>void,disabled=false)=><Pressable accessibilityRole="button" disabled={busy||disabled} onPress={onPress} style={[styles.button,(busy||disabled)&&{opacity:0.5}]}><Text style={styles.label}>{label}</Text></Pressable>;
 const close=()=>{if(!busy){setOpen(false);setUsername('');setPassword('');}};
 return <View style={styles.card}><Text style={styles.title}>Test server</Text><Text style={styles.text}>{SERVER_URL}</Text><Text style={styles.text} accessibilityLiveRegion="polite">{status}</Text>
  <View style={styles.actions}>{button('Check connection',()=>void test(),!configured)}{button('Configure',()=>setOpen(true))}{configured&&button('Forget credentials',()=>Alert.alert('Forget tester credentials?','Your recordings will stay on this phone.',[{text:'Cancel'},{text:'Forget',onPress:()=>void forget()}]))}</View>
  <Text style={styles.text}>Checks server access only. Activities are still stored on your phone.</Text>
  <Modal visible={open} animationType="slide" onRequestClose={close}><SafeAreaView style={styles.modal}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}><Text style={styles.title}>Tester credentials</Text><Text style={styles.text}>{SERVER_URL}</Text>
   <TextInput accessibilityLabel="Tester username" placeholder="Username" placeholderTextColor="#a8c6b5" style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} maxLength={128} editable={!busy}/>
   <TextInput accessibilityLabel="Tester password" placeholder="Password" placeholderTextColor="#a8c6b5" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} maxLength={256} editable={!busy}/>
   <Text style={styles.text}>Stored securely on this phone. Credentials authenticate world updates and activity uploads to this server.</Text>
   <View style={styles.actions}>{button('Save credentials',()=>void save())}{button('Cancel',close)}</View>
  </ScrollView></SafeAreaView></Modal>
 </View>;
}
const styles=StyleSheet.create({card:{padding:20,borderRadius:18,backgroundColor:'#1c3a2e',gap:12},title:{fontSize:20,color:'#eef8ef',fontWeight:'600'},text:{fontSize:14,lineHeight:20,color:'#a8c6b5'},actions:{flexDirection:'row',flexWrap:'wrap',gap:10},button:{padding:12,borderRadius:10,backgroundColor:'#284c3a'},label:{color:'#e6f2ea',fontWeight:'600'},modal:{flex:1,backgroundColor:'#10271f'},content:{padding:24,gap:18,maxWidth:700,width:'100%',alignSelf:'center'},input:{padding:16,borderRadius:12,backgroundColor:'#1c3a2e',fontSize:17,color:'#eef8ef'}});
