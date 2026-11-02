// @harvaaja-test-tier: fast
import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';

const routeMap=readFileSync(new URL('../apps/mobile/src/components/RouteMap.tsx',import.meta.url),'utf8');
const line=(needle:string)=>routeMap.split('\n').find(l=>l.includes(needle))??'';
/** Source checks only: they do not prove physical layout, gesture or folding-phone acceptance (task 3.2). */
describe('Resistance overview navigation wiring (source checks)',()=>{
 it('Locate the established field: Show affected area closes the sheet, frames the field and never touches the pin',()=>{
  const start=routeMap.indexOf('const showAffectedArea='),body=routeMap.slice(start,routeMap.indexOf('const openOverviewLab=',start));
  expect(body).toMatch(/affectedAreaBounds\(resistanceModel\)/);
  expect(body).toMatch(/if\(!bounds\)return;/);
  expect(body).toMatch(/setResistanceOpen\(false\);explore\(\);/);
  expect(body).toMatch(/camera\.current\?\.fitBounds\(bounds/);
  expect(body).toMatch(/bottom:bottomInset\+controlsHeight\+40/);
  expect(body).not.toMatch(/onDestinationChange|pinDestination/);
 });
 it('Open a lab from the overview: selection revalidates, opens existing details and does not replace the pin',()=>{
  const start=routeMap.indexOf('const openOverviewLab='),body=routeMap.slice(start,routeMap.indexOf('const pinDestination=',start));
  expect(body).toMatch(/resolveLabSelection\(/);
  expect(body).toMatch(/Alert\.alert\('Field Lab unavailable'[^)]*pinned destination is unchanged/);
  expect(body).toMatch(/selectLab\(id\)/);
  expect(body).not.toMatch(/onDestinationChange|pinDestination/);
  expect(line('const selectLab=useCallback')).toMatch(/setResistanceOpen\(false\)/);
 });
 it('Show affected area is only offered for a visible field (the model supplies no area otherwise)',()=>{
  const sheet=readFileSync(new URL('../apps/mobile/src/components/ResistanceOverviewSheet.tsx',import.meta.url),'utf8');
  expect(sheet).toMatch(/\{!!overview\.area&&<Pressable[^\n]*Show affected area/);
 });
 it('Inspect during recording: Back dismisses the overview first without leaving the map or pausing',()=>{
  const start=routeMap.indexOf("BackHandler.addEventListener"),body=routeMap.slice(start,start+220);
  expect(body).toMatch(/setResistanceOpen\(false\);return true;/);
  expect(routeMap).toMatch(/if\(!nearbyOpen&&!contactsOpen&&!resistanceOpen\)return;/);
  expect(routeMap).not.toMatch(/resistanceOpen[^\n]*(recorder|pause|finish)/i);
 });
 it('shares space exclusively with Nearby, contacts and details, and suppresses the pin card and notices',()=>{
  for(const opener of ['const openNearby=','const openContacts=','const selectOutbreak=useCallback','const selectLab=useCallback'])expect(line(opener)).toMatch(/setResistanceOpen\(false\)/);
  const open=routeMap.slice(routeMap.indexOf('const openResistance='),routeMap.indexOf('/** Frames the received field'));
  for(const closer of ['setNearbyOpen(false)','setContactsOpen(false)','setSelected(null)','setSelectedLabId(null)'])expect(open).toContain(closer);
  expect(open).not.toMatch(/onDestinationChange/);
  expect(line('const feedbackSurfaceBlocked=')).toMatch(/resistanceOpen/);
  expect(line('DestinationCard summary')).toMatch(/!resistanceOpen/);
  expect(line('<CleanupFeedback')).toMatch(/hidden=\{feedbackSurfaceBlocked\}/);
 });
 it('Change player or test environment: reset, world change and a missing snapshot dismiss the overview',()=>{
  expect(routeMap).toMatch(/setResistanceOpen\(false\);setSelected\(null\);setSelectedLabId\(null\);\},\[destinationResetKey\]/);
  expect(routeMap).toMatch(/if\(resistanceSource==='none'\)setResistanceOpen\(false\)/);
  expect(routeMap).toMatch(/world\?\.worldStartedAt!==nearbyWorld\.current\)\{setNearbyOpen\(false\);setContactsOpen\(false\);setResistanceOpen\(false\);\}/);
 });
 it('keeps pause and finish reachable: the sheet height excludes the recording HUD inset',()=>{
  const sheet=routeMap.split('\n').find(l=>l.includes('<ResistanceOverviewSheet'))??'';
  expect(sheet).toMatch(/Math\.max\(0,mapHeight-bottomInset-cardTop-16\)/);
 });
});
