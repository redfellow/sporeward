import { describe, it, expect } from 'vitest';
import { Fix, summarize, validFix, routeGeometry, recordingDuration } from './model';
const f: Fix = {timestamp:1000,latitude:61.5,longitude:23.7,accuracy:5,segment:1};
describe('recording diagnostics', () => {
 it('never bridges a paused or interrupted segment', () => { expect(summarize([f,{...f,timestamp:100000,longitude:24,segment:2}]).meters).toBe(0); });
 it('measures distance and gaps only within a segment', () => { const s = summarize([f,{...f,timestamp:2000,latitude:61.501},{...f,timestamp:5001,latitude:61.502}]); expect(s.meters).toBeCloseTo(222.39,1); expect(s.gaps).toBe(1); expect(s.maxGap).toBe(3001); });
 it('rejects invalid and future GPS fixes', () => { expect(validFix(f,1000)).toBe(true); for(const change of [{timestamp:NaN},{timestamp:7000},{latitude:91},{longitude:Infinity},{accuracy:-1}]) expect(validFix({...f,...change},1000)).toBe(false); });
});

describe('route recap',()=> {
 it('distinguishes missing GPS from paused sections on the map',()=> {
  const route=routeGeometry([f,{...f,timestamp:2000,longitude:23.701},{...f,timestamp:6000,longitude:23.702},{...f,timestamp:9000,longitude:24,segment:2},{...f,timestamp:10000,longitude:24.001,segment:2}]);
  expect(route.lines.features.map(x=>x.properties?.kind)).toEqual(['recorded','gap','recorded']);
  expect(route.lines.features.some(x=>x.geometry.coordinates.some(c=>c[0]===23.702)&&x.geometry.coordinates.some(c=>c[0]===24))).toBe(false);
  expect(route.markers.features.filter(x=>x.properties?.role==='start')).toHaveLength(2);
 });
 it('excludes paused time from the recap and supports an empty or one-fix route',()=> {
  expect(recordingDuration([{id:1,activity:'a',started:1000,ended:3000},{id:2,activity:'a',started:8000,ended:null}],10000)).toBe(4000);
  expect(routeGeometry([]).bounds).toBeNull();expect(routeGeometry([f]).lines.features).toHaveLength(0);expect(routeGeometry([f]).bounds![0]).toBeLessThan(f.longitude);
 });
});

it('fits long recordings without spreading fixes into function arguments',()=> {
 const fixes=Array.from({length:200000},(_,i)=>({...f,timestamp:f.timestamp+i*1000,longitude:23.7+i/1000000}));
 const route=routeGeometry(fixes);expect(route.lines.features).toHaveLength(1);expect(route.lines.features[0].geometry.coordinates).toHaveLength(fixes.length);expect(route.bounds![2]).toBeGreaterThan(fixes.at(-1)!.longitude);
});
