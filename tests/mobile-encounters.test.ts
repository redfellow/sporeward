import {it,expect} from 'vitest';
import {previewEncounters} from '../apps/mobile/src/recording/encounters';
import {fetchWorld} from '../apps/mobile/src/server/world';
import {parseWorldView,type WorldView} from '@sporeward/protocol';
const world:WorldView={version:1,serverTime:200000,worldStartedAt:0,outbreaks:[{id:'west',name:'West',ring:[[23.75,61.5],[23.751,61.5],[23.751,61.501],[23.75,61.501]],spawnedAt:0,clearedAt:null,status:'active',strength:4,committedCleaning:0,visitsRemaining:4,visitPoints:100,cleanupBonus:100,eligibleAt:0}]};
const fixes=Array.from({length:201},(_,i)=>({timestamp:1000+i*1000,longitude:23.747+i*.0001,latitude:61.5005,accuracy:5,segment:1}));
it('shows touched markers immediately but withholds provisional points until 500 m',()=>{
 const short=previewEncounters(fixes.slice(0,35),world,null,40000);expect(short.visited.has('west')).toBe(true);expect(short.provisionalPoints).toBe(0);expect(short.heldPoints).toBe(100);
 const full=previewEncounters(fixes,world,null,202000);expect(full.provisionalPoints).toBe(100);expect(full.distanceMetres).toBeGreaterThan(500);
});
it('retains activity-specific server-confirmed markers after the current map changes',()=>{
 const recap={activityId:'ride',confirmedVisitPoints:100,confirmedCleanupPoints:0,pendingCleanupPoints:0,encounters:[{outbreakId:'west',name:'West',contactAt:50000,visitPoints:100,cleanupPoints:0,accepted:true,reason:'accepted' as const,contributionId:'one'}],updatedAt:200000};
 expect(previewEncounters([],null,recap,202000).visited.has('west')).toBe(true);
});
it('does not estimate points for an outbreak still on cooldown at contact time',()=>{
 expect(previewEncounters(fixes,{...world,outbreaks:[{...world.outbreaks[0],eligibleAt:300000}]},null,202000).provisionalPoints).toBe(0);
});
it('validates world geometry before handing it to the native map',()=>{
 expect(()=>parseWorldView({...world,outbreaks:[{...world.outbreaks[0],ring:[[NaN,61.5],[23,61.5],[23,61.6]]}]})).toThrow();
});
it('fetches the world over authenticated HTTPS and preserves an offline error',async()=>{
 const credentials={username:'tester',password:'test-only'};
 expect(await fetchWorld(credentials,async(url,options)=>{expect(url).toBe('https://sporeward.redlan.co/world');expect(options.headers).toHaveProperty('Authorization');return new Response(JSON.stringify(world));})).toEqual(world);
 await expect(fetchWorld(credentials,async()=>{throw new Error('offline');})).rejects.toThrow('saved map');
});
