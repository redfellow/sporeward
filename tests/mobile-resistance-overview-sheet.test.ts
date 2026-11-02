// @harvaaja-test-tier: fast
import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';

const source=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const sheet=source('apps/mobile/src/components/ResistanceOverviewSheet.tsx'),routeMap=source('apps/mobile/src/components/RouteMap.tsx'),app=source('apps/mobile/App.tsx');
/** Source checks only: they do not prove physical layout, gesture or folding-phone acceptance. */
describe('Resistance sheet and live-map entry (source checks)',()=>{
 it('virtualizes lab candidates in a bounded, scrollable list',()=>{
  expect(sheet).toMatch(/<FlatList/);
  expect(sheet).toMatch(/initialNumToRender=\{6\}/);
  expect(sheet).toMatch(/windowSize=\{5\}/);
  expect(sheet).not.toMatch(/candidates\.map\(/);
  expect(sheet).toMatch(/style=\{\[styles\.sheet,\{height\}\]\}/);
  expect(routeMap).toMatch(/<ResistanceOverviewSheet [^>]*height=\{Math\.max\(0,mapHeight-bottomInset-cardTop-16\)\}/);
 });
 it('presents established, empty and unavailable states through the pure model, with Close and 44-point controls',()=>{
  expect(sheet).toMatch(/overview\.headline/);
  expect(sheet).toMatch(/overview\.qualifier/);
  expect(sheet).toMatch(/labs\.empty/);
  expect(sheet).toMatch(/minHeight:44/);
  expect(sheet).toMatch(/accessibilityLabel="Close Resistance overview"/);
  expect(sheet).not.toMatch(/centreResistance|resistance\.centre|%/);
 });
 it('offers the entry whenever the destination-aware live map is shown, whether idle, recording or paused',()=>{
  const entry=routeMap.match(/\{resistanceMode&&<Pressable[^\n]*Open personal Resistance overview[^\n]*/)?.[0]??'';
  expect(entry).toMatch(/<Text style=\{styles\.label\}>Resistance<\/Text>/);
  expect(entry).not.toMatch(/recording|activityId|paused/);
  expect(routeMap).toMatch(/const resistanceMode=destinationMode&&!!snapshotStatus;/);
  expect(routeMap).toMatch(/const destinationMode=!!onDestinationChange&&!historicalOnly;/);
 });
 it('adds no overview to historical or non-live maps',()=>{
  const mapScreens=app.split('\n').filter(line=>line.includes('<RouteMap'));
  const withOverview=mapScreens.filter(line=>line.includes('snapshotStatus='));
  expect(withOverview).toHaveLength(1);
  expect(withOverview[0]).toMatch(/onDestinationChange=\{setDestination\}/);
  expect(withOverview[0]).not.toMatch(/historicalOnly/);
 });
 it('documents the overview in the player rules with links that resolve',()=>{
  const rules=source('docs/player-rules.md');
  expect(rules).toMatch(/\*\*Resistance\*\*/);
  for(const [,target] of rules.matchAll(/\]\(([^)#:]+\.(?:md|png|jpg|svg))/g))expect(()=>readFileSync(new URL('../docs/'+target,import.meta.url))).not.toThrow();
 });
});
