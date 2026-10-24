import {describe,it,expect} from 'vitest';
import {parseActivityFootprints} from './activities';

describe('activity footprint response',()=>{
 it('accepts matching activity geometry',()=>{
  const value={activityId:'ride-1',footprints:[{outbreakId:'spore-a',contactAt:1800000000000,ring:[[23.7,61.5],[23.71,61.5],[23.71,61.51]]}]};
  expect(parseActivityFootprints(value,'ride-1')).toEqual(value);
 });
 it('rejects mismatched IDs and invalid polygon coordinates',()=>{
  const valid={activityId:'ride-1',footprints:[{outbreakId:'spore-a',contactAt:1800000000000,ring:[[23.7,61.5],[23.71,61.5],[23.71,61.51]]}]};
  expect(()=>parseActivityFootprints(valid,'ride-2')).toThrow('Invalid activity footprints.');
  expect(()=>parseActivityFootprints({...valid,footprints:[{...valid.footprints[0],ring:[[23.7,61.5],[181,61.5],[23.71,61.51]]}]},'ride-1')).toThrow('Invalid activity footprints.');
 });
});
