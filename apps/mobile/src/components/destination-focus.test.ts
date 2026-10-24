import {describe,it,expect} from 'vitest';
import type {Coordinate,EncounterRecap,FieldLabOffer,WorldView} from '@sporeward/protocol';
import {destinationSummary,distanceToTarget,type DestinationFocus} from './destination-focus';

const T=1800000000000,ring:Coordinate[]=[[23.75,61.49],[23.752,61.49],[23.752,61.492],[23.75,61.492]];
const outbreak:WorldView['outbreaks'][number]={id:'spore',name:'Park outbreak',ring,spawnedAt:T-1000,clearedAt:null,lifecycle:'ordinary',status:'active',strength:6,committedCleaning:1,visitsRemaining:5,visitPoints:70,cleanupBonus:150,eligibleAt:0};
const world:WorldView={version:1,serverTime:T,worldStartedAt:T-86400000,outbreaks:[outbreak],fieldLabs:[{id:'lab',name:'Field Lab',position:[23.751,61.491],ring,spawnedAt:T-1000,expiresAt:T+3600000,collected:false}]};
const summary=(focus:DestinationFocus={kind:'outbreak',id:'spore'},changes:Partial<Parameters<typeof destinationSummary>[0]>={})=>destinationSummary({focus,world,location:null,now:T,...changes})!;
const recap=(changes:Partial<EncounterRecap>={}):EncounterRecap=>({activityId:'outing',confirmedVisitPoints:0,confirmedCleanupPoints:0,pendingCleanupPoints:0,encounters:[],updatedAt:T,...changes});
const offer:FieldLabOffer={id:'offer',outingId:'outing',rulesVersion:1,worldStartedAt:world.worldStartedAt,issuedAt:T-1000,expiresAt:T+3600000,referenceCentre:null,labs:[{labId:'lab',distanceMetres:10000,fraction:.25}]};

describe('destination feedback',()=>{
 it('keeps possible cleanup distinct and never infers a visit from proximity',()=>{
  const result=summary(undefined,{location:{coordinate:[23.751,61.491],timestamp:T}});
  expect(result.reward).toBe('70 visit points · +150 possible cleanup');
  expect(result.distance).toBe('In target area · proximity only');expect(result.contact).toBeNull();
 });
 it('retains cooldown separately from a provisional contact and hides currently unavailable rewards',()=>{
  const result=summary(undefined,{outingId:'outing',visited:new Set(['spore']),world:{...world,outbreaks:[{...outbreak,eligibleAt:T+1000}]}});
  expect(result.availability).toBe('cooldown');expect(result.availableAt).toBe(T+1000);expect(result.reward).toBeNull();expect(result.contact).toContain('unconfirmed');
 });
 it('distinguishes a one-touch remnant, committed clearing and paused splitting',()=>{
  expect(summary(undefined,{world:{...world,outbreaks:[{...outbreak,lifecycle:'remnant'}]}}).effort).toContain('One eligible touch');
  expect(summary(undefined,{world:{...world,outbreaks:[{...outbreak,status:'clearing'}]}}).effort).toContain('Committed cleaning');
  expect(summary(undefined,{world:{...world,outbreaks:[{...outbreak,lifecycle:'stabilizing'}]}}).availability).toBe('splitting');
 });
 it('drops stale rewards for missing, cleared or expired destinations',()=>{
  expect(summary(undefined,{world:{...world,outbreaks:[]}})).toMatchObject({availability:'unavailable',ring:null,reward:null});
  expect(summary(undefined,{world:{...world,outbreaks:[{...outbreak,status:'cleared'}]}}).reward).toBeNull();
  expect(summary({kind:'lab',id:'lab'},{world:{...world,serverTime:T+3600000}}).availability).toBe('expired');
  expect(summary(undefined,{world:{...world,outbreaks:[{...outbreak,lifecycle:'remnant',phaseEndsAt:T}]}}).availability).toBe('expired');
 });
 it('shows only an offer matching the current outing and world',()=>{
  const focus:DestinationFocus={kind:'lab',id:'lab'};
  expect(summary(focus).reward).toContain('no outing offer');
  expect(summary(focus,{outingId:'outing',offer}).reward).toContain('25%');
  expect(summary(focus,{outingId:'other',offer}).reward).toContain('unconfirmed');
  expect(summary(focus,{outingId:'outing',offer:{...offer,worldStartedAt:T}}).reward).toContain('unconfirmed');
  expect(summary(focus,{outingId:'outing',offer:{...offer,expiresAt:T}}).reward).toContain('unconfirmed');
 });
 it('separates provisional lab contact from confirmed restoration, including sub-one-percent values',()=>{
  const focus:DestinationFocus={kind:'lab',id:'lab'},recorded=summary(focus,{outingId:'outing',provisionalLabs:new Set(['lab'])});
  expect(recorded.availability).toBe('available');expect(recorded.contact).toContain('provisional');
  const result={labId:'lab',contactAt:T,status:'confirmed' as const,rewardName:'Rare Specimen' as const,offerSource:'quoted' as const,offeredFraction:.25,actualFraction:.001,resistanceReduction:1,limited:true};
  expect(summary(focus,{outingId:'outing',recap:recap({labCollections:[result]})})).toMatchObject({availability:'collected',reward:'Rare Specimen · <1% restoration'});
  expect(summary(focus,{outingId:'outing',recap:recap({labCollections:[{...result,resistanceReduction:0,actualFraction:0}]})}).reward).toContain('No resistance restored');
  expect(summary(focus,{outingId:'other',recap:recap({labCollections:[result]})}).availability).toBe('available');
 });
});
describe('direct distance to a contact area',()=>{
 it('measures to the edge rather than the centre and treats the boundary as in-area',()=>{
  const distance=distanceToTarget(ring,{coordinate:[23.754,61.491],timestamp:T},T)!;
  expect(distance).toBeGreaterThan(100);expect(distance).toBeLessThan(115);
  expect(distanceToTarget(ring,{coordinate:[23.751,61.491],timestamp:T},T)).toBe(0);
  expect(distanceToTarget(ring,{coordinate:[23.75,61.491],timestamp:T},T)).toBe(0);
 });
 it('accepts the two-minute boundary but omits old, future or missing locations',()=>{
  expect(distanceToTarget(ring,{coordinate:[23.754,61.491],timestamp:T-120000},T)).not.toBeNull();
  expect(distanceToTarget(ring,{coordinate:[23.754,61.491],timestamp:T-120001},T)).toBeNull();
  expect(distanceToTarget(ring,{coordinate:[23.754,61.491],timestamp:T+5001},T)).toBeNull();
  expect(distanceToTarget(ring,null,T)).toBeNull();
 });
});
