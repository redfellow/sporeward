import {Linking,StyleSheet,Text} from 'react-native';
/** Linked credits occupy normal layout space, never a floating map overlay. */
export function MapAttribution(){
 const link=(url:string)=>{void Linking.openURL(url).catch(()=>{});};
 return <Text style={styles.footer}>
  <Text accessibilityRole="link" onPress={()=>link('https://openfreemap.org/')}>OpenFreeMap</Text>{' · '}
  <Text accessibilityRole="link" onPress={()=>link('https://openmaptiles.org/')}>OpenMapTiles</Text>{' · '}
  <Text accessibilityRole="link" onPress={()=>link('https://www.openstreetmap.org/copyright')}>© OpenStreetMap contributors</Text>
 </Text>;
}
const styles=StyleSheet.create({footer:{color:'#b8cebf',backgroundColor:'#10271f',fontSize:10,lineHeight:14,textAlign:'center',paddingHorizontal:8,paddingVertical:4}});
