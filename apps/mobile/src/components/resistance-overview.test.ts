// @harvaaja-test-tier: fast
import {describe,it,expect} from 'vitest';
import type {Coordinate,EncounterRecap,FieldLabOffer,WorldView} from '@sporeward/protocol';
import {affectedAreaBounds,resistanceOverview,resolveLabSelection,type OverviewContext,type OverviewSnapshotStatus} from './resistance-overview';

const T=1800000000000;
const ring=(x=23.75):Coordinate[]=>[[x,61.49],[x+.002,61.49],[x+.002,61.492],[x,61.492]];
const lab=(id:string,x=23.75,changes:Partial<NonNullable<WorldView['fieldLabs']>[number]>={}):NonNullable<WorldView['fieldLabs']>[number]=>({id,name:'Field Lab',position:[x,61.491],ring:ring(x),spawnedAt:T-1000,expiresAt:T+1000,collected:false,...changes});
const resistance={rulesVersion:1 as const,scoringVersion:2 as const,activatedAt:T-1,centre:[23.75,61.49] as Coordinate,radiusMetres:900,centreResistance:0.37};
const world:WorldView={version:1,worldStartedAt:T-86400000,serverTime:T,outbreaks:[],resistance,fieldLabs:[lab('far',23.8),lab('near')]};
const received:OverviewSnapshotStatus={source:'received',receivedAt:T,refresh:'idle'};
const context:OverviewContext={world,now:T,location:{coordinate:[23.754,61.491],timestamp:T},snapshot:received};
const text=(o:ReturnType<typeof resistanceOverview>)=>[o.headline,o.qualifier,...o.explanation,...o.recovery,o.spatialNote,o.labs.coverage,o.labs.distanceNote].filter(Boolean).join(' ');

describe('personal Resistance overview model',()=>{
 it('Understand familiar-route rewards: an established field explains reduced ordinary visit points and unchanged cleaning',()=>{
  const o=resistanceOverview(context);
  expect(o).toMatchObject({field:'established',freshness:'current',area:{centre:[23.75,61.49],radiusMetres:900}});
  expect(o.explanation.join(' ')).toMatch(/ordinary visit points/i);
  expect(o.explanation.join(' ')).toMatch(/committed cleaning and cleanup bonuses keep their usual rules/);
 });
 it('Continue local play without labs: recovery is passive, labs optional, with no deadline or guarantee',()=>{
  const o=resistanceOverview(context);
  expect(o.recovery.join(' ')).toMatch(/passively/);
  expect(o.recovery.join(' ')).toMatch(/optional/);
  expect(text(o)).not.toMatch(/guarantee|will earn|countdown|in \d+ (hours|days|minutes)|\bETA\b|ready by|until/i);
 });
 it('Inspect the circular edge: copy states geography summary and never a percentage or raw resistance',()=>{
  const o=resistanceOverview(context);
  expect(o.spatialNote).toMatch(/summarizes your cleaning geography/);
  expect(o.spatialNote).toMatch(/rather than switching at its edge/);
  expect(text(o)).not.toMatch(/%|0\.37|37/);
 });
 it('Explicitly empty personal field: no centre or zero resistance is empty and not framable',()=>{
  for(const changed of [{...resistance,centre:null},{...resistance,centreResistance:0}]){
   const o=resistanceOverview({...context,world:{...world,resistance:changed}});
   expect(o).toMatchObject({field:'empty',area:null});
   expect(o.headline).toMatch(/No active personal field is established in this snapshot/);
   expect(text(o)).not.toMatch(/maximum points|full points|disabled/i);
  }
 });
 it('World lacks Resistance data: reports unavailable, not zero resistance or disabled',()=>{
  const o=resistanceOverview({...context,world:{...world,resistance:undefined}});
  expect(o).toMatchObject({field:'unavailable',area:null,freshness:'current'});
  expect(o.headline).toMatch(/unavailable for this world/);
  expect(text(o)).not.toMatch(/zero|disabled|no resistance/i);
  expect(resistanceOverview({...context,world:null,snapshot:{source:'none',receivedAt:null,refresh:'idle'}})).toMatchObject({field:'unavailable',freshness:'none'});
  expect(resistanceOverview({...context,world:null,snapshot:{source:'none',receivedAt:null,refresh:'loading'}})).toMatchObject({field:'loading',freshness:'loading'});
 });
 it('Offline after a known snapshot: failed refresh keeps last-known context with its time and qualified labs',()=>{
  const o=resistanceOverview({...context,snapshot:{source:'received',receivedAt:T-60000,refresh:'failed'}});
  expect(o).toMatchObject({field:'established',freshness:'last-known',snapshotTime:T-60000});
  expect(o.qualifier).toMatch(/Last-known information from/);
  expect(o.labs.coverage).toMatch(/last-known/);
  expect(o.labs.candidates.map(l=>l.focus.id)).toEqual(['near','far']);
  expect(resistanceOverview({...context,snapshot:{...received,refresh:'loading'}}).freshness).toBe('current');
 });
 it('Change player or test environment: unknown cache provenance withholds personal context and labs',()=>{
  const o=resistanceOverview({...context,snapshot:{source:'unattributed',receivedAt:null,refresh:'idle'}});
  expect(o).toMatchObject({field:'withheld',area:null,snapshotTime:null,freshness:'none'});
  expect(o.labs.candidates).toEqual([]);
  expect(o.explanation).toEqual([]);
 });
 it('Explore before recording: labs show distance but no fabricated restoration without an outing offer',()=>{
  const o=resistanceOverview(context);
  expect(o.labs.candidates.map(l=>l.focus.id)).toEqual(['near','far']);
  expect(o.labs.candidates.every(l=>l.reward==='Restoration unconfirmed · no outing offer')).toBe(true);
  expect(o.labs.candidates[0].metres).toBeLessThan(o.labs.candidates[1].metres!);
  expect(o.labs.located).toBe(true);
  expect(o.labs.distanceNote).toMatch(/straight-line/);
 });
 it('orders by stable id (all labs share one name) and omits distances when location is missing or stale',()=>{
  const w={...world,fieldLabs:[lab('b'),lab('a',23.8)]};
  for(const changed of [{location:null},{now:T+120001}]){
   const o=resistanceOverview({...context,world:w,...changed});
   expect(o.labs.located).toBe(false);
   expect(o.labs.candidates.map(l=>l.focus.id)).toEqual(['a','b']);
   expect(o.labs.candidates.every(l=>l.metres===null&&l.distance.includes('unavailable'))).toBe(true);
  }
 });
 it('uses only matching unexpired outing offers and keeps provisional collection unconfirmed',()=>{
  const offer:FieldLabOffer={id:'offer',outingId:'outing',rulesVersion:1,worldStartedAt:world.worldStartedAt,issuedAt:T-1,expiresAt:T+1000,referenceCentre:null,labs:[{labId:'near',distanceMetres:100,fraction:.25}]};
  const c={...context,outingId:'outing',provisionalLabs:new Set(['near']),offer};
  const near=(x:OverviewContext)=>resistanceOverview(x).labs.candidates.find(l=>l.focus.id==='near')!;
  expect(near(c)).toMatchObject({reward:'Up to 25% restoration · confirms on upload',contact:'Contact recorded · collection provisional',availability:'available'});
  for(const stale of [{...c,outingId:'other'},{...c,offer:{...offer,worldStartedAt:T}},{...c,offer:{...offer,expiresAt:T}}])expect(near(stale).reward).toContain('no outing offer');
 });
 it('Target changes before selection: confirmed, collected, expired and removed labs leave the candidates',()=>{
  const recap:EncounterRecap={activityId:'outing',confirmedVisitPoints:0,confirmedCleanupPoints:0,pendingCleanupPoints:0,encounters:[],updatedAt:T,labCollections:[{labId:'near',contactAt:T,status:'confirmed',rewardName:'Rare Specimen',offerSource:'quoted',offeredFraction:.25,actualFraction:.1,resistanceReduction:1,limited:false}]};
  const ids=(c:OverviewContext)=>resistanceOverview(c).labs.candidates.map(l=>l.focus.id);
  expect(ids({...context,outingId:'outing',recap})).toEqual(['far']);
  expect(ids({...context,world:{...world,fieldLabs:[lab('c',23.75,{collected:true}),lab('e',23.75,{expiresAt:T}),lab('ok')]}})).toEqual(['ok']);
  const none=resistanceOverview({...context,world:{...world,fieldLabs:[]}});
  expect(none.field).toBe('established');
  expect(none.labs).toMatchObject({candidates:[],empty:'No available Field Labs in the loaded world.'});
 });
});

describe('affected-area framing and lab selection',()=>{
 it('Locate the established field: bounds cover the received centre and radius, and invisible fields have none',()=>{
  const [w,south,e,n]=affectedAreaBounds(resistanceOverview(context))!;
  expect([(w+e)/2,(south+n)/2]).toEqual([expect.closeTo(23.75,9),expect.closeTo(61.49,9)]);
  expect((n-south)*111320).toBeCloseTo(1800,0);
  expect((e-w)*111320*Math.cos(61.49*Math.PI/180)).toBeCloseTo(1800,0);
  for(const changed of [{...resistance,centre:null},{...resistance,centreResistance:0},undefined])expect(affectedAreaBounds(resistanceOverview({...context,world:{...world,resistance:changed}}))).toBeNull();
  expect(affectedAreaBounds({area:{centre:[23.75,61.49],radiusMetres:0}})).toBeNull();
  expect(affectedAreaBounds(resistanceOverview({...context,snapshot:{source:'unattributed',receivedAt:null,refresh:'idle'}}))).toBeNull();
 });
 it('Target changes before selection: a stale lab does not open and a current one does',()=>{
  expect(resolveLabSelection(context,'near')).toBe('open');
  expect(resolveLabSelection({...context,world:{...world,fieldLabs:[lab('far',23.8)]}},'near')).toBe('unavailable');
  expect(resolveLabSelection({...context,world:{...world,fieldLabs:[lab('near',23.75,{collected:true})]}},'near')).toBe('unavailable');
  expect(resolveLabSelection({...context,world:{...world,serverTime:T+1000}},'near')).toBe('unavailable');
  expect(resolveLabSelection({...context,world:null,snapshot:{source:'none',receivedAt:null,refresh:'idle'}},'near')).toBe('unavailable');
  expect(resolveLabSelection({...context,snapshot:{source:'unattributed',receivedAt:null,refresh:'idle'}},'near')).toBe('unavailable');
 });
});
