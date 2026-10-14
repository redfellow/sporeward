import {describe,it,expect} from 'vitest';
import {matchContacts,type Footprint} from '@sporeward/game';
import {captureFootprint} from './history.ts';
const old:Footprint={id:'moving',ring:[[23.7,61.5],[23.701,61.5],[23.701,61.501],[23.7,61.501]],validFrom:1000,validUntil:null};
const moved:Footprint={...old,ring:old.ring.map(([x,y])=>[x+.01,y]),validFrom:10000};
describe('historical footprint contacts',()=>{
 it('matches earlier GPS against the earlier shape and rejects the old location after transition',()=>{
  const history:Footprint[]=[];captureFootprint(history,old);captureFootprint(history,moved);
  expect(history[0].validUntil).toBe(10000);
  const fix={longitude:23.7005,latitude:61.5005,segment:1};
  expect(matchContacts([{...fix,timestamp:9000}],history)).toEqual([{outbreakId:'moving',timestamp:9000}]);
  expect(matchContacts([{...fix,timestamp:10000}],history)).toEqual([]);
  expect(matchContacts([{...fix,longitude:23.7105,timestamp:10000}],history)).toEqual([{outbreakId:'moving',timestamp:10000}]);
 });
 it('coalesces same-time changes, preserves copies and updates expiry without losing original start',()=>{
  const history:Footprint[]=[];captureFootprint(history,old);captureFootprint(history,{...moved,validFrom:1000});
  expect(history).toHaveLength(1);captureFootprint(history,{...moved,validUntil:20000});
  expect(history[0].validFrom).toBe(1000);expect(history[0].validUntil).toBe(20000);
  expect(old.validUntil).toBeNull();expect(()=>captureFootprint(history,{...old,validFrom:0})).toThrow();
 });
});
