import {Alert} from 'react-native';

/** Keep recording until the user explicitly accepts ending the outing. */
export function confirmFinish():Promise<boolean> {
 return new Promise(resolve=>Alert.alert('Finish outing?', 'End this outing and save your recording? Upload will start automatically.', [
  {text:'Continue outing',style:'cancel',onPress:()=>resolve(false)},
  {text:'Finish & save',onPress:()=>resolve(true)},
 ], {cancelable:true,onDismiss:()=>resolve(false)}));
}
