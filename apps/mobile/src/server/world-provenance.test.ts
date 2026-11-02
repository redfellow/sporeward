// @harvaaja-test-tier: fast
import {describe,it,expect} from 'vitest';
import type {WorldView} from '@sporeward/protocol';
import {NO_PROVENANCE,overviewSnapshotStatus,reduceProvenance,worldIdentity,type ProvenanceEvent,type WorldProvenance} from './world-provenance';

const A=worldIdentity('https://s','alice'),B=worldIdentity('https://s','bob'),OTHER_SERVER=worldIdentity('https://t','alice');
const world=(worldStartedAt=100):WorldView=>({version:1,serverTime:1000,worldStartedAt,outbreaks:[]});
const run=(...events:ProvenanceEvent[])=>events.reduce<WorldProvenance>(reduceProvenance,NO_PROVENANCE);

describe('world snapshot provenance',()=>{
 it('first load: nothing is known until the first fetch lands',()=>{
  const loading=run({type:'refreshing',key:A});
  expect(overviewSnapshotStatus(loading,null)).toEqual({source:'none',receivedAt:null,refresh:'loading'});
  const done=reduceProvenance(loading,{type:'received',key:A,at:5000,worldStartedAt:100});
  expect(overviewSnapshotStatus(done,world())).toEqual({source:'received',receivedAt:5000,refresh:'idle'});
 });
 it('last-known: a failed refresh keeps the attributable snapshot and its time',()=>{
  const failed=run({type:'received',key:A,at:5000,worldStartedAt:100},{type:'refreshing',key:A},{type:'failed',key:A});
  expect(overviewSnapshotStatus(failed,world())).toEqual({source:'received',receivedAt:5000,refresh:'failed'});
  expect(overviewSnapshotStatus(reduceProvenance(failed,{type:'received',key:A,at:9000,worldStartedAt:100}),world())).toMatchObject({receivedAt:9000,refresh:'idle'});
 });
 it('unknown legacy cache provenance stays unattributed, even through a failed refresh, until a fetch succeeds',()=>{
  const cached=run({type:'cache',key:A});
  expect(overviewSnapshotStatus(cached,world())).toEqual({source:'unattributed',receivedAt:null,refresh:'idle'});
  expect(overviewSnapshotStatus(reduceProvenance(reduceProvenance(cached,{type:'refreshing',key:A}),{type:'failed',key:A}),world())).toMatchObject({source:'unattributed',refresh:'failed'});
  expect(overviewSnapshotStatus(reduceProvenance(cached,{type:'received',key:A,at:7,worldStartedAt:100}),world()).source).toBe('received');
 });
 it('a cache load never downgrades an attributable snapshot for the same identity',()=>{
  const received=run({type:'received',key:A,at:5000,worldStartedAt:100});
  expect(reduceProvenance(received,{type:'cache',key:A})).toBe(received);
  expect(reduceProvenance(received,{type:'cache',key:B})).toMatchObject({key:B,source:'unattributed',receivedAt:null});
 });
 it('owner, server and world resets invalidate earlier provenance',()=>{
  const received=run({type:'received',key:A,at:5000,worldStartedAt:100});
  expect(reduceProvenance(received,{type:'reset'})).toBe(NO_PROVENANCE);
  for(const key of [B,OTHER_SERVER])expect(reduceProvenance(received,{type:'refreshing',key})).toEqual({...NO_PROVENANCE,key,refresh:'loading'});
  // A different world generation is not described by the old receive time.
  expect(overviewSnapshotStatus(received,world(200))).toEqual({source:'unattributed',receivedAt:null,refresh:'idle'});
 });
 it('late async results for another identity cannot restore or fail the current status',()=>{
  const current=run({type:'received',key:B,at:6000,worldStartedAt:100});
  expect(reduceProvenance(current,{type:'failed',key:A})).toBe(current);
  expect(overviewSnapshotStatus(reduceProvenance(NO_PROVENANCE,{type:'failed',key:A}),world()).source).toBe('none');
 });
});
