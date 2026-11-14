// @harvaaja-test-tier: fast
import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';

const routeMap=readFileSync(new URL('../apps/mobile/src/components/RouteMap.tsx',import.meta.url),'utf8');
const feedback=readFileSync(new URL('../apps/mobile/src/components/ContactFeedback.tsx',import.meta.url),'utf8');
const line=(needle:string)=>routeMap.split('\n').find(l=>l.includes(needle))??'';
/** Source checks only: they do not prove physical layout, gesture or phone acceptance (the manual check after merge). */
describe('Recent contacts sheet wiring (source checks)',()=>{
 it('Leave Recent contacts: Android Back and Close dismiss the sheet and return to the map',()=>{
  const start=routeMap.indexOf('BackHandler.addEventListener'),back=routeMap.slice(start,start+200);
  expect(routeMap).toMatch(/if\(!nearbyOpen&&!contactsOpen&&!resistanceOpen\)return;/);
  expect(back).toMatch(/hardwareBackPress/);
  expect(back).toMatch(/setContactsOpen\(false\);[^\n]*return true;/);
  expect(line('<RecentContactsSheet')).toMatch(/onClose=\{\(\)=>setContactsOpen\(false\)\}/);
  expect(feedback).toMatch(/accessibilityLabel="Close recent contacts" onPress=\{onClose\}/);
 });
 it('Open Recent contacts while recording: opening and closing never pause or finish the outing',()=>{
  const open=line('const openContacts=');
  expect(open).toMatch(/setContactsOpen\(true\)/);
  for(const text of [open,line('<RecentContactsSheet'),line('hardwareBackPress'),feedback])expect(text).not.toMatch(/pause|finish|stop|recorder|onFinish/i);
  // The sheet height excludes the recording HUD inset so pause and finish stay reachable.
  expect(line('<RecentContactsSheet')).toMatch(/Math\.max\(0,mapHeight-bottomInset-cardTop-16\)/);
 });
 it('Review many contacts: the list is a virtualized FlatList, not a mapped ScrollView',()=>{
  expect(feedback).toMatch(/import \{[^}]*\bFlatList\b[^}]*\} from 'react-native'/);
  expect(feedback).toMatch(/<FlatList [^\n]*data=\{feedback\.rows\}/);
  expect(feedback).toMatch(/windowSize=\{\d+\}/);
  expect(feedback).not.toMatch(/ScrollView|feedback\.rows\.map/);
 });
});
