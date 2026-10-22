import {it,expect,vi} from 'vitest';
vi.mock('../apps/mobile/src/server/session',()=>({rememberAccountMode:vi.fn()}));
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

it('retains the observed first contact and estimate when a contour moves, while new outings start empty',()=>{
 const first=previewEncounters(fixes,world,null,202000);
 const moved={...world,outbreaks:world.outbreaks.map(o=>({...o,ring:o.ring.map(([x,y])=>[x+.1,y] as [number,number]),visitPoints:50,eligibleAt:300000}))};
 const later=previewEncounters(fixes,moved,null,202000,first.observations);
 expect(later.visited.has('west')).toBe(true);expect(later.provisionalPoints).toBe(100);
 expect(previewEncounters(fixes,null,null,202000,first.observations).provisionalPoints).toBe(100);
 expect(previewEncounters(fixes,moved,null,202000).visited.size).toBe(0);
});

// Regression: the field world had 2,108 live outbreaks after disintegration.
// The old 1,000-outbreak parser kept the pre-shoreline cached map forever.
it('accepts the latest shoreline world with ordinary outbreaks and more than a thousand remnants',async()=>{
 const latest={...world,serverTime:300000,outbreaks:Array.from({length:2108},(_,i)=>({...world.outbreaks[0],id:'field-'+i,lifecycle:i<600?'ordinary':'remnant',ring:[[23.75,61.5],[23.7505,61.5],[23.7505,61.501],[23.75,61.501]]}))};
 const result=await fetchWorld({username:'tester',password:'test-only'},async()=>new Response(JSON.stringify(latest)));
 expect(result.outbreaks).toHaveLength(2108);expect(result.serverTime).toBe(300000);expect(result.outbreaks[0].ring).toEqual(latest.outbreaks[0].ring);
});
it('still bounds oversized world counts and aggregate geometry',()=>{
 expect(()=>parseWorldView({...world,outbreaks:Array(10001).fill(world.outbreaks[0])})).toThrow('Invalid world response');
 const complex={...world.outbreaks[0],ring:Array(500).fill([23.75,61.5])};
 expect(()=>parseWorldView({...world,outbreaks:Array(2001).fill(complex)})).toThrow('geometry exceeds');
});
