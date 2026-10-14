import {describe,it,expect} from 'vitest';
import type {ReplayTrack} from '@sporeward/protocol';
import {nativeReplayPlan} from './native-plan';
const track:ReplayTrack={version:1,source:{name:'fixture.json',format:'json',sha256:'a'.repeat(64)},started:1000,ended:21000,sections:[{id:1,started:1000,ended:21000}],fixes:[1000,2000,15000,16000,20000].map(timestamp=>({timestamp,latitude:61.5,longitude:23.7,segment:1,accuracy:5})),events:[],summary:{fixes:5}};
describe('native replay window gaps',()=>{
 it('stops GPS delivery when the selected window ends inside a source gap',()=>{
  const plan=nativeReplayPlan(track,0,5000);
  expect(plan.events.filter(e=>e.action.startsWith('gps-'))).toEqual([{at:2000,order:1,action:'gps-off'}]);
 });
 it('starts inside an outage using the earlier fix, then restores GPS after positioning',()=>{
  const plan=nativeReplayPlan(track,5000,10000);
  expect(plan.first.timestamp).toBe(2000);
  expect(plan.events.filter(e=>e.action.startsWith('gps-'))).toEqual([{at:0,order:1,action:'gps-off'},{at:9000,order:1,action:'gps-on'}]);
  expect(plan.events.filter(e=>e.at===9000).map(e=>e.action)).toEqual(['fix','gps-on']);
 });
});
