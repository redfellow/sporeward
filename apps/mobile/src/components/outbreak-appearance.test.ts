import {describe,expect,it} from 'vitest';
import {outbreakMarkerComposition} from './outbreak-appearance';

const now=100;
const outbreak=(overrides:Partial<Parameters<typeof outbreakMarkerComposition>[0]>={})=>({
 id:'fixture',name:'Fixture',lifecycle:'ordinary',ring:[[23.76,61.49],[23.761,61.49],[23.761,61.491],[23.76,61.491]],
 spawnedAt:0,clearedAt:null,status:'active',strength:2,committedCleaning:0,visitsRemaining:4,visitPoints:10,cleanupBonus:50,eligibleAt:0,
 ...overrides,
} as Parameters<typeof outbreakMarkerComposition>[0]);

const cases=[
 {name:'clearing',overrides:{status:'clearing'},lifecycle:'clearing',uncontactedGroup:'clearing'},
 {name:'withering',overrides:{status:'withering'},lifecycle:'withering',uncontactedGroup:'active'},
 {name:'remnant',overrides:{lifecycle:'remnant'},lifecycle:'remnant',uncontactedGroup:'remnants'},
 {name:'unavailable cooldown',overrides:{eligibleAt:101},lifecycle:'cooldown',uncontactedGroup:'unavailable'},
] as const;

describe('outbreak marker contact composition',()=>{
 for(const mode of ['overview','detailed'] as const)for(const state of cases){
  it(`keeps ${state.name} identity and contact separate in ${mode} markers`,()=>{
   const target=outbreak(state.overrides),uncontacted=outbreakMarkerComposition(target,now,false),contacted=outbreakMarkerComposition(target,now,true);
   expect(uncontacted.lifecycle).toBe(state.lifecycle);
   expect(contacted.lifecycle).toBe(state.lifecycle);
   expect(uncontacted.icon).toBe(`badge-${state.lifecycle}`);
   expect(contacted.icon).toBe(uncontacted.icon);
   expect(contacted.palette).toEqual(uncontacted.palette);
   expect(uncontacted.contacted).toBe(false);
   expect(uncontacted.contactIcon).toBeNull();
   expect(contacted.contacted).toBe(true);
   expect(contacted.contactIcon).toBe('badge-visited');
   expect(uncontacted.summaryGroup).toBe(state.uncontactedGroup);
   // Group summaries retain their established contact-sensitive unavailable bucket.
   expect(contacted.summaryGroup).toBe('unavailable');
   expect(contacted).not.toHaveProperty('points');
  });
 }
});
