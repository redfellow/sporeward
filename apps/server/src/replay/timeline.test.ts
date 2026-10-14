import {describe,it,expect} from 'vitest';
import {SimulationClock,ReplayTimeline} from './timeline';
import {parseReplayTrack,rebaseReplay,type ReplayTrack} from '@sporeward/protocol';
const track:ReplayTrack={version:1,source:{name:'private.json',format:'json',sha256:'a'.repeat(64)},started:1000,ended:20000,sections:[{id:1,started:1000,ended:5000},{id:2,started:10000,ended:15000}],fixes:[{timestamp:1000,latitude:61.5,longitude:23.7,segment:1,accuracy:5},{timestamp:4000,latitude:61.501,longitude:23.7,segment:1,accuracy:5},{timestamp:11000,latitude:61.502,longitude:23.7,segment:2,accuracy:5}],events:[{timestamp:5000,kind:'pause'},{timestamp:10000,kind:'resume'}],summary:{fixes:3}};
describe('replay timing',()=>{
 it('rebases dates without compressing gaps, pauses or final paused time',()=>{
  const payload=rebaseReplay(parseReplayTrack(track),1800000000000,'replay-one');
  expect(payload.activity.ended-payload.activity.started).toBe(19000);
  expect(payload.fixes[1].timestamp-payload.fixes[0].timestamp).toBe(3000);
  expect(payload.activity.sections[1].started-payload.activity.sections[0].ended).toBe(5000);
  expect(payload.activity.ended-payload.activity.sections[1].ended).toBe(5000);
 });
 it('rejects corrupt pause boundaries and cross-batch timestamp disorder',()=>{
  expect(()=>parseReplayTrack({...track,sections:[{id:1,started:2000,ended:5000}]})).toThrow();
  expect(()=>parseReplayTrack({...track,events:[{timestamp:30000,kind:'pause'}]})).toThrow();
 });
 it('holds future events, preserves ordering, pauses and repeats after reset',()=>{
  const clock=new SimulationClock(1000),timeline=new ReplayTimeline(clock,[{at:2000,order:2,value:'b'},{at:2000,order:1,value:'a'},{at:3000,order:3,value:'c'}]);
  expect(timeline.start()).toEqual([]);expect(timeline.advance(999)).toEqual([]);
  timeline.pause();expect(timeline.advance(5000)).toEqual([]);expect(clock.now()).toBe(1999);
  timeline.resume();expect(timeline.advance(1).map(e=>e.value)).toEqual(['a','b']);
  expect(timeline.next().map(e=>e.value)).toEqual(['c']);expect(timeline.status().state).toBe('finished');
  timeline.advance(3600000);expect(clock.now()).toBe(3603000);
  timeline.reset();expect(clock.now()).toBe(1000);expect(timeline.start()).toEqual([]);expect(timeline.next().map(e=>e.value)).toEqual(['a','b']);
 });
});
