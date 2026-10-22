import { expect, it } from 'vitest';
import { FIELD_LAB_RULES, advanceFieldLabs, spawnFieldLabs } from './field-labs';
import { loadTampereAccess } from './spatial/tampere';
import { matchContacts, resistanceDistance, BALANCE } from '@sporeward/game';
import { tilePosition } from './spatial/access';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WorldStore } from './world-store';

it('spawns shared stable accessible destinations, rarer and longer-lived than ordinary targets', async () => {
 const { cells, map } = await loadTampereAccess();
 const at = 1800000000000;
 const labs = spawnFieldLabs(cells, 73, 0, at);
 expect(spawnFieldLabs([...cells].reverse(), 73, 0, at)).toEqual(labs);
 expect(labs.length).toBeLessThan(20);
 expect(FIELD_LAB_RULES.lifetimeMs).toBeGreaterThan(BALANCE.growthDurationMs + BALANCE.disintegrationDurationMs + BALANCE.maximumExtensionMs);
 for (const lab of labs) {
  const [x, y] = tilePosition(lab.position);
  const cell = cells.find(cell => cell.x === Math.floor(x) && cell.y === Math.floor(y))!;
  expect(cell.ways).toContain(lab.accessWay);
  const way = map.ways.find(way => way.id === lab.accessWay)!;
  expect(way).toBeDefined();
  expect(lab.ring).toHaveLength(64);
  const center={longitude:lab.position[0],latitude:lab.position[1]},radii=lab.ring.map(p=>resistanceDistance(center,{longitude:p[0],latitude:p[1]}));
  expect(Math.max(...radii)-Math.min(...radii)).toBeLessThan(.001);
  const oldCellWidth=6371000*Math.cos(lab.position[1]*Math.PI/180)*(360/2**17)*Math.PI/180;
  expect(radii[0]*2).toBeCloseTo(oldCellWidth*2,3);
  const contact=(factor:number)=>matchContacts([{timestamp:at+1,longitude:lab.position[0]+(lab.ring[0][0]-lab.position[0])*factor,latitude:lab.position[1]+(lab.ring[0][1]-lab.position[1])*factor,segment:1}],[{id:lab.id,ring:lab.ring,validFrom:lab.spawnedAt,validUntil:lab.expiresAt}],0);
  expect(contact(.85)).toHaveLength(1); // Outside the former cell, inside the new circle.
  expect(contact(1.15)).toHaveLength(0);
  // The larger circular collection footprint contains the original accessible cell.
  expect(matchContacts([{ timestamp: at + 1, longitude: lab.position[0], latitude: lab.position[1], segment: 1 }], [{ id: lab.id, ring: lab.ring, validFrom: lab.spawnedAt, validUntil: lab.expiresAt }])).toHaveLength(1);
 }
 const replacement = advanceFieldLabs({ version: 1, epoch: 0, labs }, cells, 73, at, at + FIELD_LAB_RULES.lifetimeMs);
 expect(replacement.labs.filter(lab => lab.spawnedAt === at + FIELD_LAB_RULES.lifetimeMs)).toHaveLength(2);
 expect(replacement.labs).toHaveLength(4);
 expect(spawnFieldLabs(cells, 73, 0, at)).toEqual(labs);
});

it('persists identical shared destinations for both accounts and resets isolated state deterministically', async () => {
 const { cells } = await loadTampereAccess();
 const root = await mkdtemp(join(tmpdir(), 'sporeward-field-labs-'));
 try {
  const world = new WorldStore(root, () => 1800000000000, () => [], { spatial: cells, seed: 73, allowSimulationReset: true });
  await world.prepareFieldLabs();
  const first = await world.view('a');
  expect((await world.view('b')).fieldLabs).toEqual(first.fieldLabs);
  expect(first.outbreaks).toEqual([]);
  const restarted = new WorldStore(root, () => 1800000000000, () => [], { spatial: cells, seed: 73, allowSimulationReset: true });
  expect((await restarted.view('a')).fieldLabs).toEqual(first.fieldLabs);
  await restarted.resetForSimulation(); await restarted.prepareFieldLabs();
  expect((await restarted.view('a')).fieldLabs).toEqual(first.fieldLabs);
 } finally { await rm(root, { recursive: true, force: true }); }
});
