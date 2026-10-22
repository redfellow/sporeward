import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createWorld } from '../../packages/game/src/index.ts';
import { WorldStore, type Persisted } from '../../apps/server/src/world-store.ts';
import { parseWorldSnapshot } from '../../apps/server/src/database/import.ts';

// Entirely synthetic disposable data. Never accepts a field directory or connection string.
const root = await mkdtemp(join(tmpdir(), 'sporeward-resistance-migration-'));
const at = 1800000000000;
try {
 const key = createHash('sha256').update('owner\0old-ride').digest('hex');
 const state: Persisted = {
  version: 1, startedAt: at, engine: createWorld({ ids: ['old'] }),
  fixtures: [{ id: 'old', name: 'Old', accessWay: 1, ring: [[23.7, 61.5], [23.701, 61.5], [23.701, 61.501]] }],
  contributions: [{ id: 'old-contribution', player: 'owner', activityId: 'old-ride', outbreakId: 'old', contactAt: at, visitPoints: 100 }],
  bonuses: { old: 'old-contribution' },
  activities: { [key]: { player: 'owner', started: at, ended: at, results: [{ outbreakId: 'old', name: 'Old', contactAt: at, visitPoints: 100, cleanupPoints: 100, accepted: true, reason: 'accepted', contributionId: 'old-contribution' }] } },
  footprints: [{ id: 'old', ring: [[23.7, 61.5], [23.701, 61.5], [23.701, 61.501]], validFrom: at, validUntil: null }],
 };
 state.engine.scores.owner = 200;
 await writeFile(join(root, 'world.json'), JSON.stringify(state));
 const recording = JSON.stringify({ id: 'old-ride', sections: [], fixes: [] });
 await writeFile(join(root, 'recording.json'), recording);
 const store = new WorldStore(root, () => at);
 await store.configureResistance(true);
 const enabled = parseWorldSnapshot(JSON.parse(await readFile(join(root, 'world.json'), 'utf8')));
 assert.deepEqual(enabled.resistance?.players, {});
 const { resistance, ...unchanged } = enabled;
 assert.deepEqual(unchanged, state);
 await store.configureResistance(false);
 const rolledBack = parseWorldSnapshot(JSON.parse(await readFile(join(root, 'world.json'), 'utf8')));
 assert.deepEqual(rolledBack, { ...enabled, resistance: { ...resistance, enabled: false } });
 await store.configureResistance(true);
 assert.deepEqual(JSON.parse(await readFile(join(root, 'world.json'), 'utf8')), enabled);
 assert.equal(await readFile(join(root, 'recording.json'), 'utf8'), recording);
 console.log(JSON.stringify({ neutralActivation: true, legacySnapshotUnchanged: true, rollbackRetainsState: true, recordingUnchanged: true }));
} finally {
 await rm(root, { recursive: true, force: true });
}
