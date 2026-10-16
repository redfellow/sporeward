import {describe,it,expect} from 'vitest';
import {createWorld,applyVisit} from '@sporeward/game';
import {parseWorldView} from '@sporeward/protocol';
import {outbreakView} from './outbreak-view';
const start=1800000000000,fixture={id:'zone',name:'Zone',accessWay:1,ring:[[23,61],[23.01,61],[23,61.01]] as [number,number][]};
describe('player-facing outbreak state',()=>{
 it('advertises a one-touch bonus-only remnant and its expiry',()=>{
  const world=createWorld({ids:['zone']}),o=world.targets[0];o.remnant=true;o.bonus=25;o.expires=72*60;
  const v=outbreakView(world,o,fixture,'rider',start,start);
  expect(v).toMatchObject({lifecycle:'remnant',visitPoints:0,cleanupBonus:25,visitsRemaining:1,phaseEndsAt:start+72*3600000});
  const result=applyVisit(world,o.id,'rider');expect(result.points).toBe(v.visitPoints);expect(world.scores.rider).toBe(v.cleanupBonus);
 });
 it('shows the disintegration deadline and updates it after an accepted cleaning visit',()=>{
  const world=createWorld({ids:['zone']}),o=world.targets[0];world.time=o.deadline-world.balance.disintegrationDurationMs/60000;
  const before=outbreakView(world,o,fixture,'rider',start,start+world.time*60000);expect(before.lifecycle).toBe('disintegrating');
  applyVisit(world,o.id,'rider');const after=outbreakView(world,o,fixture,'rider',start,start+world.time*60000);
  expect(o.deadline*60000+start).toBe(before.phaseEndsAt!+world.balance.fullVisitExtensionMs);
  // An extension may postpone entry to the announced phase as well as its end.
  expect(after.lifecycle).toBe('ordinary');
 });
 it('honours configured cooldowns and stabilization in the eligibility time',()=>{
  const world=createWorld({ids:['zone'],balance:{visitCooldownMs:123*60000}}),o=world.targets[0];
  applyVisit(world,o.id,'rider');o.stabilize=200;
  expect(outbreakView(world,o,fixture,'rider',start,start).eligibleAt).toBe(start+200*60000);
 });
 it('reports the full protected arrival reward and accepts old world responses',()=>{
  const world=createWorld({ids:['zone']}),o=world.targets[0];o.cleared=0;o.strength=0;o.history.rider={count:2,last:-400};
  const view=outbreakView(world,o,fixture,'rider',start,start);expect(view.visitPoints).toBe(world.balance.firstVisitPoints);
  const response={version:1,serverTime:start,worldStartedAt:start,outbreaks:[view]};expect(parseWorldView(response)).toEqual(response);
  const {lifecycle,phaseEndsAt,...legacy}=view;expect(parseWorldView({...response,outbreaks:[legacy]}).outbreaks).toHaveLength(1);
  expect(()=>parseWorldView({...response,outbreaks:[{...view,lifecycle:'unknown'}]})).toThrow();
 });
});
