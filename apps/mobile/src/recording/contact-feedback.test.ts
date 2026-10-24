import {describe,it,expect} from 'vitest';
import {mergeContactEntries,contactEntryText,enqueueContactNotice,advanceContactNotice,emptyNotices,type ContactEntry} from './contact-feedback';
import type {EncounterRecap} from '@sporeward/protocol';
const entry=(id='spore',changes:Partial<ContactEntry>={}):ContactEntry=>({kind:'outbreak',id,name:'Park outbreak',timestamp:1000,estimate:70,reason:'unknown',consumed:true,...changes});
describe('personal contact summaries',()=>{
 it('retains earliest evidence and never reprices it from a newer snapshot',()=>{
  const original=entry();const rows=mergeContactEntries([original],[entry('spore',{timestamp:2000,estimate:100})],null,'outing');
  expect(rows).toEqual([original]);expect(original.estimate).toBe(70);
  expect(mergeContactEntries(rows,[entry('spore',{timestamp:900,estimate:50,consumed:false})],null,'outing')[0]).toMatchObject({timestamp:900,estimate:50,consumed:true});
 });
 it('separates target kinds, sorts by contact time and represents unknown zero estimates honestly',()=>{
  const rows=mergeContactEntries([],[entry(),entry('spore',{kind:'lab',timestamp:1100,estimate:null})],null,'outing');
  expect(rows.map(e=>e.kind)).toEqual(['lab','outbreak']);
  expect(contactEntryText(entry('x',{estimate:0}),true)).not.toContain('cooldown');
  expect(contactEntryText(entry('x',{estimate:0,reason:'cooldown'}),true)).toContain('cooldown');
  expect(contactEntryText(rows[0],true)).toContain('provisional');
  expect(contactEntryText(entry(),false)).toContain('held');expect(contactEntryText(entry(),true)).toContain('awaiting validation');
 });
 it('reconciles only the same outing and does not retain a rejected estimate as confirmed points',()=>{
  const recap:EncounterRecap={activityId:'outing',confirmedVisitPoints:0,confirmedCleanupPoints:0,pendingCleanupPoints:0,encounters:[{outbreakId:'spore',name:'Park',contactAt:1000,visitPoints:0,cleanupPoints:0,accepted:false,reason:'cooldown',contributionId:null}],updatedAt:2000};
  expect(mergeContactEntries([entry()],[],recap,'other')[0].outcome).toBeUndefined();
  const e=mergeContactEntries([entry()],[],recap,'outing')[0];expect(contactEntryText(e,true)).toBe('Not awarded · revisit cooldown');expect(e.estimate).toBe(70);
 });
 it('keeps at most one active and one grouped pending notice without creating totals',()=>{
  let state=enqueueContactNotice(emptyNotices(),[entry('a')],0);
  state=enqueueContactNotice(state,[entry('b')],500);
  expect(advanceContactNotice(state,999).active).toBeNull();
  state=advanceContactNotice(state,1000);expect(state.active?.entries).toHaveLength(2);
  state=enqueueContactNotice(state,[entry('c')],2000);state=enqueueContactNotice(state,[entry('d')],2500);
  expect(state.pending?.entries).toHaveLength(2);expect(state.active?.entries).toHaveLength(2);
  state=advanceContactNotice(state,5000);expect(state.active?.entries.map(e=>e.id)).toEqual(['c','d']);expect(state.pending).toBeNull();
  expect(advanceContactNotice(state,9000)).toEqual(emptyNotices());
 });
});
