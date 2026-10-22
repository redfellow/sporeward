import { afterEach, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { activityReceipt, parseWorldView, parseEncounterRecap, type ActivityChunk } from '@sporeward/protocol';
import { resistanceAt } from '@sporeward/game';
import { WorldStore, type Persisted } from './world-store';
import { ownerResistance } from './resistance-state';
import type { TestOutbreak } from './test-outbreaks';
import { createApp } from './app';

const T = 1800000000000;
const fixtures: TestOutbreak[] = [{ id: 'west', name: 'West', accessWay: 1, ring: [[23.75, 61.5], [23.751, 61.5], [23.751, 61.501], [23.75, 61.501]] }];
const payload = (id: string, started: number): ActivityChunk => ({
 activity: { id, started, ended: started + 200000, sections: [{ id: 1, started, ended: started + 200000 }] },
 chunkCount: 1, totalFixes: 201,
 fixes: Array.from({ length: 201 }, (_, i) => ({ timestamp: started + i * 1000, longitude: 23.747 + i * .0001, latitude: 61.5005, accuracy: 5, segment: 1 })),
});
const dirs: string[] = [];
afterEach(async () => { await Promise.all(dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true }))); });
async function setup() {
 const root = await mkdtemp(join(tmpdir(), 'sporeward-resistance-')); dirs.push(root);
 let now = T;
 const clock = () => now;
 const world = new WorldStore(root, clock, () => fixtures);
 await world.view('a');
 const path = join(root, 'world.json');
 const saved: Persisted = JSON.parse(await readFile(path, 'utf8'));
 saved.engine.targets[0].strength = 100; saved.engine.targets[0].unit = 20;
 await writeFile(path, JSON.stringify(saved));
 const read = async (): Promise<Persisted> => JSON.parse(await readFile(path, 'utf8'));
 const process = (store: WorldStore, player: string, batch: ActivityChunk) => store.process(player, batch.activity, batch.fixes, activityReceipt(batch.activity, batch.fixes, clock()));
 return { world, root, clock, read, process, setNow: (value: number) => { now = value; } };
}

it('atomically persists personal events and awards through concurrent retries, restart and account separation', async () => {
 const s = await setup(); await s.world.configureResistance(true);
 const ride = payload('ride', T + 1000); s.setNow(ride.activity.ended);
 const retries = await Promise.all(Array.from({ length: 5 }, () => s.process(s.world, 'a', ride)));
 expect(retries.every(result => result.confirmedVisitPoints === 100)).toBe(true);
 const restarted = new WorldStore(s.root, s.clock);
 expect(await s.process(restarted, 'a', ride)).toEqual(retries[0]);
 const saved = await s.read();
 expect(ownerResistance(saved.resistance!, 'a').contributions).toHaveLength(1);
 expect(ownerResistance(saved.resistance!, 'b').contributions).toHaveLength(0);
 expect(saved.contributions[0].scoringVersion).toBe(2);
 const next = payload('next', T + 7 * 3600000); s.setNow(next.activity.ended);
 expect((await s.process(restarted, 'a', next)).confirmedVisitPoints).toBeLessThan(100);
 expect((await s.process(restarted, 'b', next)).confirmedVisitPoints).toBe(100);
 await restarted.tick();
 const final = await s.read();
 expect(ownerResistance(final.resistance!, 'a').contributions.map(event => event.strength)).toEqual([1, .75]);
 expect((await restarted.activity('a', 'ride'))!.confirmedVisitPoints).toBe(100);
});

it('starts neutral without backfilling old uploads and retains state on rollback and reactivation', async () => {
 const s = await setup();
 const old = payload('old', T + 1000); s.setNow(old.activity.ended);
 const confirmed = await s.process(s.world, 'a', old);
 const baseline = await s.read();
 s.setNow(T + 8 * 3600000); await s.world.configureResistance(true);
 expect((await s.read()).resistance!.players).toEqual({});
 const late = payload('before-activation', T + 7 * 3600000);
 await s.process(s.world, 'b', late);
 expect((await s.read()).resistance!.players).toEqual({});
 expect(await s.world.activity('a', 'old')).toEqual({ ...confirmed, updatedAt: s.clock() });
 const activated = await s.read();
 expect(activated.fixtures).toEqual(baseline.fixtures);
 expect(activated.contributions[0]).toEqual(baseline.contributions[0]);
 const current = payload('current', T + 9 * 3600000); s.setNow(current.activity.ended);
 await s.process(s.world, 'a', current);
 const personal = (await s.read()).resistance!;
 await s.world.configureResistance(false); await s.world.configureResistance(true);
 expect((await s.read()).resistance).toEqual(personal);
});

it('handles both late upload orders without rewriting confirmed awards or replaying resistance', async () => {
 for (const order of [[0, 1], [1, 0]]) {
  const s = await setup(); await s.world.configureResistance(true);
  const rides = [payload('early', T + 1000), payload('late', T + 7 * 3600000)];
  s.setNow(T + 8 * 3600000);
  const first = await s.process(s.world, 'a', rides[order[0]]);
  await s.process(s.world, 'a', rides[order[1]]);
  expect(await s.world.activity('a', rides[order[0]].activity.id)).toEqual(first);
  for (const ride of rides) await s.process(s.world, 'a', ride);
  const saved = await s.read();
  const personal = ownerResistance(saved.resistance!, 'a');
  expect(personal.contributions).toHaveLength(2);
  expect(personal.contributions.map(event => event.at)).toEqual([...personal.contributions.map(event => event.at)].sort((a, b) => a - b));
  expect(resistanceAt(personal, s.clock())).toBeGreaterThan(0);
  expect((await s.world.standings())[0].points).toBe(saved.contributions.reduce((sum, event) => sum + event.visitPoints, 0));
 }
});

it('matches owner map offers to awards and recaps and never selects another account from query input', async () => {
 const s = await setup(); await s.world.configureResistance(true);
 const first = payload('first', T + 1000); s.setNow(first.activity.ended);
 await s.process(s.world, 'a', first);
 const next = payload('next', T + 7 * 3600000); s.setNow(next.activity.ended);
 const accounts = {
  authenticate: async (token: string) => ['a', 'b'].includes(token) ? { id: token, name: token, username: token } : null,
  register: async () => { throw new Error('unused'); }, login: async () => { throw new Error('unused'); }, logout: async () => {},
 };
 const app = await createApp({ worldStore: s.world, accounts });
 try {
  expect((await app.inject({ url: '/world' })).statusCode).toBe(401);
  const owner = parseWorldView((await app.inject({ url: '/world?player=b', headers: { 'x-sporeward-session': 'a' } })).json());
  const other = parseWorldView((await app.inject({ url: '/world?player=a', headers: { 'x-sporeward-session': 'b' } })).json());
  expect(owner.resistance!.centreResistance).toBeGreaterThan(0);
  expect(other.resistance!.centre).toBeNull();
  expect(other.resistance!.centreResistance).toBe(0);
  expect(other.outbreaks[0].visitPoints).toBe(100);
  const award = parseEncounterRecap(await s.process(s.world, 'a', next), 'next');
  expect(award.encounters[0].visitPoints).toBe(owner.outbreaks[0].visitPoints);
  expect(award.encounters[0].scoringVersion).toBe(2);
  expect((await app.inject({ url: '/activities/next/encounters', headers: { 'x-sporeward-session': 'b' } })).statusCode).toBe(404);
  expect(() => parseWorldView({ ...owner, resistance: { ...owner.resistance, centre: [NaN, 61] } })).toThrow();
  expect(() => parseWorldView({ ...owner, resistance: { ...owner.resistance, centreResistance: -1 } })).toThrow();
  expect(() => parseWorldView({ ...owner, outbreaks: [{ ...owner.outbreaks[0], scoringVersion: 99 }] })).toThrow();
  expect(() => parseEncounterRecap({ ...award, encounters: [{ ...award.encounters[0], scoringVersion: 99 }] }, 'next')).toThrow();
 } finally { await app.close(); }
});
