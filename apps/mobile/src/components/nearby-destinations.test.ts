import {describe,it,expect} from 'vitest';
import type {Coordinate,EncounterRecap,FieldLabOffer,WorldView} from '@sporeward/protocol';
import {destinationSummary} from './destination-focus';
import {nearbyDestinations,nearbyTargetExists,type NearbyContext} from './nearby-destinations';

const T=1800000000000;
const ring=(x=23.75):Coordinate[]=>[[x,61.49],[x+.002,61.49],[x+.002,61.492],[x,61.492]];
const outbreak=(id:string,x=23.75,changes:Partial<WorldView['outbreaks'][number]>={}):WorldView['outbreaks'][number]=>({id,name:id,ring:ring(x),spawnedAt:T-1000,clearedAt:null,lifecycle:'ordinary',status:'active',strength:6,committedCleaning:1,visitsRemaining:5,visitPoints:70,cleanupBonus:150,eligibleAt:0,...changes});
const lab=(id:string,changes:Partial<NonNullable<WorldView['fieldLabs']>[number]>={}):NonNullable<WorldView['fieldLabs']>[number]=>({id,name:'Field Lab',position:[23.751,61.491],ring:ring(),spawnedAt:T-1000,expiresAt:T+1000,collected:false,...changes});
const world:WorldView={version:1,worldStartedAt:T-86400000,serverTime:T,outbreaks:[outbreak('near'),outbreak('far',23.8)],fieldLabs:[lab('lab')]};
const context:NearbyContext={world,now:T,location:{coordinate:[23.754,61.491],timestamp:T}};
const rows=(c:NearbyContext=context)=>nearbyDestinations(c).sections.flatMap(s=>s.data);

describe('nearby loaded-world comparison',()=>{
 it('includes targets beyond the viewport and filters type without mutating the world',()=>{
  const original=JSON.stringify(world);
  expect(rows().map(r=>r.focus.id)).toEqual(['lab','near','far']);
  expect(nearbyDestinations(context,'outbreak').count).toBe(2);
  expect(nearbyDestinations(context,'lab').sections[0].data.map(r=>r.focus.kind)).toEqual(['lab']);
  expect(JSON.stringify(world)).toBe(original);
 });
 it('groups eligible clearing targets before closer cooldown/splitting/collected targets',()=>{
  const result=nearbyDestinations({...context,world:{...world,outbreaks:[outbreak('cool',23.75,{eligibleAt:T+1}),outbreak('split',23.75,{lifecycle:'stabilizing'}),outbreak('clearing',23.8,{status:'clearing'})],fieldLabs:[lab('collected',{collected:true})]}});
  expect(result.sections.map(s=>s.title)).toEqual(['Available to you','Not available now']);
  expect(result.sections[0].data.map(r=>r.focus.id)).toEqual(['clearing']);
  expect(result.sections[1].data.every(r=>r.reward===null)).toBe(true);
 });
 it('orders by raw polygon-edge distance, then stable identity for equal names and distances',()=>{
  const c={...context,world:{...world,fieldLabs:[],outbreaks:[outbreak('a',23.75002,{name:'Same'}),outbreak('z',23.75,{name:'Same'}),outbreak('b',23.75002,{name:'Same'})]}};
  const result=rows(c);
  expect(result.map(r=>r.focus.id)).toEqual(['a','b','z']);
  expect(result[0].distance).toBe(result[2].distance);
  expect(result[0].metres).toBeLessThan(result[2].metres!);
  expect(rows({...c,world:{...c.world,outbreaks:[...c.world.outbreaks].reverse()}}).map(r=>r.focus.id)).toEqual(['a','b','z']);
 });
 it('omits cleared and expired targets at the received world time, including collected expired labs',()=>{
  const c={...context,now:T+1000000,world:{...world,outbreaks:[outbreak('cleared',23.75,{status:'cleared'}),outbreak('expired',23.75,{lifecycle:'remnant',phaseEndsAt:T})],fieldLabs:[lab('old',{expiresAt:T}),lab('old-collected',{expiresAt:T,collected:true}),lab('valid')]}};
  expect(rows(c).map(r=>r.focus.id)).toEqual(['valid']);
 });
 it('uses names without numeric distance when location ages past two minutes or is absent',()=>{
  const c={...context,world:{...world,fieldLabs:[],outbreaks:[outbreak('Zulu'),outbreak('Alpha',23.8)]}};
  expect(rows({...c,now:T+120000}).map(r=>r.focus.id)).toEqual(['Zulu','Alpha']);
  for(const changed of [{...c,now:T+120001},{...c,location:null}]){
   const result=nearbyDestinations(changed);
   expect(result.located).toBe(false);expect(result.sections[0].data.map(r=>r.focus.id)).toEqual(['Alpha','Zulu']);
   expect(result.sections[0].data.every(r=>r.metres===null&&r.distance.includes('unavailable'))).toBe(true);
  }
 });
 it('reuses target rewards and isolates current-outing contacts, lab offers and confirmed results',()=>{
  const offer:FieldLabOffer={id:'offer',outingId:'outing',rulesVersion:1,worldStartedAt:world.worldStartedAt,issuedAt:T-1,expiresAt:T+1000,referenceCentre:null,labs:[{labId:'lab',distanceMetres:10000,fraction:.25}]};
  const recap:EncounterRecap={activityId:'other',confirmedVisitPoints:0,confirmedCleanupPoints:0,pendingCleanupPoints:0,encounters:[],updatedAt:T,labCollections:[{labId:'lab',contactAt:T,status:'confirmed',rewardName:'Rare Specimen',offerSource:'quoted',offeredFraction:.25,actualFraction:.001,resistanceReduction:1,limited:true}]};
  const c={...context,outingId:'outing',visited:new Set(['near']),provisionalLabs:new Set(['lab']),offer,recap};
  for(const row of rows(c))expect(row).toEqual(destinationSummary({...c,focus:row.focus}));
  expect(rows(c).find(r=>r.focus.id==='lab')).toMatchObject({availability:'available',reward:'Up to 25% restoration · confirms on upload',contact:'Contact recorded · collection provisional'});
  expect(rows(c).find(r=>r.focus.id==='near')?.contact).toContain('unconfirmed');
  expect(rows({...c,outingId:null}).find(r=>r.focus.id==='lab')?.reward).toContain('no outing offer');
  expect(rows({...c,offer:{...offer,worldStartedAt:T}}).find(r=>r.focus.id==='lab')?.reward).toContain('no outing offer');
  expect(rows({...c,offer:{...offer,expiresAt:T}}).find(r=>r.focus.id==='lab')?.reward).toContain('no outing offer');
  expect(rows({...c,outingId:'other'}).find(r=>r.focus.id==='lab')).toMatchObject({availability:'collected',reward:'Rare Specimen · <1% restoration'});
 });
 it('distinguishes no snapshot from a filter with no loaded matches',()=>{
  expect(nearbyDestinations({...context,world:null})).toMatchObject({count:0,sections:[],empty:'No world data yet. Connect to load destinations.'});
  expect(nearbyDestinations({...context,world:{...world,fieldLabs:[]}},'lab').empty).toBe('No Field Labs in the loaded world.');
 });
 it('re-resolves rows after removal, clearing, expiry or an identity reset',()=>{
  const focus={kind:'outbreak' as const,id:'near'};
  expect(nearbyTargetExists(focus,world)).toBe(true);
  expect(nearbyTargetExists(focus,null)).toBe(false);
  expect(nearbyTargetExists(focus,{...world,outbreaks:[]})).toBe(false);
  expect(nearbyTargetExists(focus,{...world,outbreaks:[outbreak('near',23.75,{status:'cleared'})]})).toBe(false);
  expect(nearbyTargetExists({kind:'lab',id:'lab'},{...world,serverTime:T+1000})).toBe(false);
 });
});
