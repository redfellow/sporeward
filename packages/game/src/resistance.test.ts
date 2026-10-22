import { describe, expect, it } from 'vitest';
import { applyVisit, createWorld, advanceWorld } from './engine';
import {
 commitResistance, createResistance, recoveredResistance, resistanceAt,
 resistanceVisitPoints, RESISTANCE_RULES, visitRewardFraction,
 resistanceDistance, resistanceWeight, selectResistanceCentre, snapshotResistanceCentre,
 collectRestoration, collectionFactor, restorationFraction,
} from './resistance';

const event = (id = 'accepted', strength = 1, at = 0) => ({
 id, strength, at, point: { longitude: 23.76, latitude: 61.49 },
});

describe('bounded global restoration', () => {
 it('caps distance and cannot bank restoration at zero resistance', () => {
  expect(restorationFraction(0, 1)).toBe(0);
  expect(restorationFraction(5000, 1)).toBe(.4);
  expect(restorationFraction(10000, 1)).toBe(.8);
  expect(restorationFraction(100000, 1)).toBe(.8);
  const result = collectRestoration(createResistance(), 'empty', 0, 10000, .9);
  expect(result.reduction).toBe(0);
  expect(result.fraction).toBe(0);
  const later = commitResistance(result.state, event('later', 1, 1), true).state;
  expect(resistanceAt(later, 1)).toBe(RESISTANCE_RULES.inputPerFullContribution);
  expect(collectionFactor(later, 1)).toBeLessThan(1);
 });

 it('restores everywhere once, caps quotes and continuously diminishes across distinct labs', () => {
  const state = commitResistance(createResistance(), event(), true).state;
  const first = collectRestoration(state, 'lab-1', 1, 10000, .9);
  expect(resistanceAt(first.state, 1)).toBeCloseTo(resistanceAt(state, 1) * .2);
  expect(collectRestoration(first.state, 'lab-1', 1, 10000, .9).added).toBe(false);
  const second = collectRestoration(first.state, 'lab-2', 2, 10000, .9);
  expect(second.fraction).toBeLessThan(first.fraction);
  expect(collectionFactor(second.state, RESISTANCE_RULES.collectionRecoveryHalfLifeMs)).toBeGreaterThan(collectionFactor(second.state, 2));
  expect(collectRestoration(state, 'quote', 1, 10000, .2).fraction).toBe(.2);
  expect(resistanceAt(first.state, 0)).toBe(resistanceAt(state, 0));
 });

 it('two-hotspot repetition cannot reset the personal collection factor', () => {
  let state = createResistance();
  const fractions: number[] = [];
  for (let i = 0; i < 20; i++) {
   state = commitResistance(state, event(`visit-${i}`, 1, i * 1000), true).state;
   const result = collectRestoration(state, `${i % 2}-replacement-${i}`, i * 1000 + 1, 10000, .9);
   fractions.push(result.fraction);
   state = result.state;
  }
  expect(fractions.at(-1)).toBeLessThan(.03);
  expect(resistanceAt(JSON.parse(JSON.stringify(state)), 20000)).toBeGreaterThan(0);
 });

 it('caps delayed settlement using current collection load and never restores subsequently imported history', () => {
  const state = commitResistance(createResistance(), event('known', 1, 0), true).state;
  const first = collectRestoration(state, 'newer', 1000, 10000, .8, 2000);
  const earlier = collectRestoration(first.state, 'older', 500, 10000, .8, 2000);
  expect(earlier.fraction).toBeLessThanOrEqual(.8 / 3);
  expect(earlier.reduction).toBeCloseTo(resistanceAt(first.state, 2000) - resistanceAt(earlier.state, 2000));
  const withLateInput = commitResistance(earlier.state, event('late-input', 1, 100), true).state;
  expect(resistanceAt(withLateInput, 2000) - resistanceAt(earlier.state, 2000)).toBeCloseTo(recoveredResistance(.23, 1900));
 });
});

describe('representative-point geography experiments', () => {
 const west = { longitude: 23.6, latitude: 61.49 };
 const east = { longitude: 23.9, latitude: 61.49 };
 const make = () => [
  { ...event('west-1'), point: west }, { ...event('west-2'), point: west },
  { ...event('east'), point: east },
 ].reduce((state, item) => commitResistance(state, item, true).state, createResistance());

 it('retains familiarity when a new outbreak replaces one at the same location', () => {
  const state = make();
  expect(resistanceAt(state, 0, point => resistanceWeight(west, point))).toBeCloseTo(.46);
  const replacement = commitResistance(state, { ...event('replacement'), point: west }, true).state;
  expect(resistanceAt(replacement, 0, point => resistanceWeight(west, point))).toBeCloseTo(.69);
  expect(resistanceWeight(west, east)).toBe(0);
 });

 it('selects the strongest cluster while the mean lies between separated routines', () => {
  const state = make();
  expect(selectResistanceCentre(state, 0)?.point).toEqual(west);
  expect(selectResistanceCentre(state, 0, 'average')?.point.longitude).toBeCloseTo(23.7);
  expect(selectResistanceCentre(createResistance(), 0)).toBeNull();
 });

 it('bounds centre movement and keeps outing snapshots stable', () => {
  const state = make();
  const centre = selectResistanceCentre(state, 0)!;
  const outing = snapshotResistanceCentre(centre)!;
  const eastern = Array.from({ length: 5 }, (_, i) => ({ ...event(`new-${i}`, 1, 86400000), point: east }))
   .reduce((s, item) => commitResistance(s, item, true).state, state);
  const moved = selectResistanceCentre(eastern, 86400000, 'concentration', centre)!;
  expect(resistanceDistance(centre.point, moved.point)).toBeCloseTo(500, -1);
  expect(outing).toEqual({ point: west, at: 0 });
  centre.point.longitude = 0;
  expect(outing.point).toEqual(west);
  expect(() => selectResistanceCentre(state, 0, 'concentration', moved)).toThrow();
 });
});

describe('prospective resistance scoring', () => {
 it('accumulates committed strength proportionally and rejects retries and ineligible contacts', () => {
  const full = commitResistance(createResistance(), event(), true).state;
  const half = commitResistance(createResistance(), event('half', .5), true).state;
  expect(resistanceAt(full, 0)).toBe(2 * resistanceAt(half, 0));
  expect(commitResistance(full, event(), true)).toEqual({ state: full, added: false });
  expect(commitResistance(full, event('cooldown'), false)).toEqual({ state: full, added: false });
  expect(commitResistance(full, event('no cleaning', 0), true).added).toBe(false);
 });

 it('recovers continuously, excludes future events, and survives JSON and delivery permutations', () => {
  const early = event('early', 1, 10), late = event('late', .5, 20);
  const run = (events: typeof early[]) => events.reduce((state, item) => commitResistance(state, item, true).state, createResistance());
  const state = run([late, early]);
  expect(state).toEqual(run([early, late]));
  expect(resistanceAt(state, 9)).toBe(0);
  expect(resistanceAt(JSON.parse(JSON.stringify(state)), 20)).toBe(resistanceAt(state, 20));
  expect(recoveredResistance(2, RESISTANCE_RULES.halfLifeMs)).toBe(1);
  expect(resistanceAt(state, 20 + RESISTANCE_RULES.halfLifeMs)).toBeCloseTo(resistanceAt(state, 20) / 2);
 });

 it('uses one bounded curve with a soft threshold at half reward', () => {
  expect(visitRewardFraction(0)).toBe(1);
  expect(visitRewardFraction(2)).toBe(.5);
  expect(visitRewardFraction(2) - visitRewardFraction(3)).toBeLessThan(visitRewardFraction(1) - visitRewardFraction(2));
  for (const input of [0, .01, 2, 10, 1e9]) {
   expect(resistanceVisitPoints(100, input, true)).toBeGreaterThanOrEqual(25);
   expect(resistanceVisitPoints(100, input, true)).toBeLessThanOrEqual(100);
   expect(resistanceVisitPoints(100, input, false)).toBe(0);
  }
 });

 it('leaves legacy cleaning strength and cleanup awards unchanged', () => {
  const world = createWorld({ effort: 1, ids: ['target'] });
  expect(applyVisit(world, 'target', 'rider')).toMatchObject({ points: 100, power: 1 });
  expect(applyVisit(world, 'target', 'rider')).toMatchObject({ accepted: false, points: 0, power: 0 });
  advanceWorld(world, 720);
  expect(world.scores.rider).toBe(200);
  const repeats = createWorld({ effort: 100, ids: ['target'] });
  for (const power of [1, .75, .6, .5, .5]) {
   expect(applyVisit(repeats, 'target', 'rider').power).toBe(power);
   advanceWorld(repeats, 360);
  }
 });

 it('rejects invalid numerical inputs', () => {
  expect(() => commitResistance(createResistance(), event('bad', NaN), true)).toThrow();
  expect(() => recoveredResistance(1, -1)).toThrow();
  expect(() => visitRewardFraction(Infinity)).toThrow();
  const state = commitResistance(createResistance(), event(), true).state;
  expect(() => resistanceAt(state, 0, () => 2)).toThrow();
 });
});
