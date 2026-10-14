import {describe,it,expect} from 'vitest';
import {matchContacts,type ContactFix,type Footprint} from './contacts';
const zone:Footprint={id:'test',ring:[[23,61],[23.0002,61],[23.0002,61.0002],[23,61.0002]],validFrom:0,validUntil:null};
const fix=(timestamp:number,longitude:number,latitude=61.0001,segment=1):ContactFix=>({timestamp,longitude,latitude,segment});
describe('historical outbreak contacts',()=>{
 it('detects an interpolated crossing with neither endpoint inside',()=>{
  const result=matchContacts([fix(1000,22.999),fix(2000,23.001)], [zone]);
  expect(result).toHaveLength(1);expect(result[0]!.timestamp).toBeGreaterThan(1000);expect(result[0]!.timestamp).toBeLessThan(2000);
 });
 it('does not bridge pauses or GPS gaps',()=>{
  expect(matchContacts([fix(1000,22.999),fix(2000,23.001,61.0001,2)],[zone])).toEqual([]);
  expect(matchContacts([fix(1000,22.999),fix(3001,23.001)],[zone])).toEqual([]);
  expect(matchContacts([fix(1000,22.999),fix(3000,23.001)],[zone])).toHaveLength(1);
 });
 it('accepts touching within ten metres but excludes more distant fixes',()=>{
  expect(matchContacts([fix(1000,23.0001,60.99992)],[zone])).toHaveLength(1);
  expect(matchContacts([fix(1000,23.0001,60.99990)],[zone])).toEqual([]);
 });
 it('matches only the geometry active at crossing time',()=>{
  expect(matchContacts([fix(1000,23.0001)],[{...zone,validFrom:1001}])).toEqual([]);
  expect(matchContacts([fix(1000,23.0001)],[{...zone,validUntil:1000}])).toEqual([]);
  const result=matchContacts([fix(1000,22.999),fix(2000,23.001)],[{...zone,validFrom:1700}]);
  expect(result).toEqual([]);
 });
 it('returns the earliest contact even with multiple footprint versions',()=>{
  const result=matchContacts([fix(1000,23.0001),fix(2000,23.0001)],[{...zone,validFrom:1500},zone]);
  expect(result).toEqual([{outbreakId:'test',timestamp:1000}]);
 });
 it('rejects missing timestamps and unordered fixes',()=>{
  expect(()=>matchContacts([fix(NaN,23)],[zone])).toThrow();
  expect(()=>matchContacts([fix(2000,23),fix(1000,23)],[zone])).toThrow();
 });
});
