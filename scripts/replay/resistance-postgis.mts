import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Pool } from 'pg';
import { parseEncounterRecap, parseFieldLabOffer, type ActivityChunk, type RecordedFix } from '../../packages/protocol/src/index.ts';
import { resistanceDistance } from '../../packages/game/src/index.ts';
import { ActivityStore } from '../../apps/server/src/activity-store.ts';
import { createApp } from '../../apps/server/src/app.ts';
import { PostgresWorldPersistence } from '../../apps/server/src/database/world.ts';
import { spawnFieldLabs } from '../../apps/server/src/field-labs.ts';
import { loadTampereAccess } from '../../apps/server/src/spatial/tampere.ts';
import { tampereTestOutbreaks } from '../../apps/server/src/test-outbreaks.ts';
import { WorldStore, type Persisted } from '../../apps/server/src/world-store.ts';
import { cleanupReplayWorlds, newReplayWorldIds, replayDatabaseUrl, REPLAY_DATABASE_NAME } from './resistance-postgis-support.ts';

const databaseUrl = replayDatabaseUrl();
const basePool = new Pool({ connectionString: databaseUrl, max: 2, connectionTimeoutMillis: 8000 });
const baseline = Date.UTC(2026, 9, 19, 5); // Monday 08:00 in Tampere local time during daylight saving time.
const day = 86400000;
const access = await loadTampereAccess();
const { cells } = access;
const labs = spawnFieldLabs(cells, 73, 3, baseline);
const home = { longitude: 23.7619996, latitude: 61.4839089 };
const point = (position: readonly [number, number]) => ({ longitude: position[0], latitude: position[1] });
const weekendLab = [...labs].sort((a, b) => resistanceDistance(home, point(a.position)) - resistanceDistance(home, point(b.position)))[0];
assert.ok(weekendLab, 'The deterministic Tampere fixture must provide a weekend Field Lab.');
const allWorldIds: string[] = [];
let schemaReady = false;
let untouchedBefore: Record<string, number> | undefined;

async function unrelatedCounts(excludedIds: string[]) {
	const result = await basePool.query(`
		SELECT 'worlds' AS kind, count(*)::int AS count FROM sw_worlds WHERE id <> ALL($1::text[])
		UNION ALL SELECT 'footprints', count(*)::int FROM sw_footprints WHERE world_id <> ALL($1::text[])
		UNION ALL SELECT 'contributions', count(*)::int FROM sw_contributions WHERE world_id <> ALL($1::text[])
		UNION ALL SELECT 'bonuses', count(*)::int FROM sw_bonus_owners WHERE world_id <> ALL($1::text[])
		UNION ALL SELECT 'imports', count(*)::int FROM sw_world_imports WHERE world_id <> ALL($1::text[])
	`, [excludedIds]);
	return Object.fromEntries(result.rows.map(row => [row.kind, Number(row.count)])) as Record<string, number>;
}

function makeRide(id: string, started: number, position: { longitude: number; latitude: number }): ActivityChunk {
	const ended = started + 300000;
	const fixes: RecordedFix[] = Array.from({ length: 301 }, (_, index) => ({
		timestamp: started + index * 1000,
		longitude: position.longitude + (index / 300 - 0.5) * 0.026,
		latitude: position.latitude,
		accuracy: 5,
		segment: 1,
	}));
	return { activity: { id, started, ended, sections: [{ id: 1, started, ended }] }, totalFixes: fixes.length, chunkCount: 1, fixes };
}

const rounded = (value: number) => Math.round(value * 1e6) / 1e6;

async function runArm(worldId: string, includeLab: boolean, captureBaseline: boolean) {
	const root = await mkdtemp(join(tmpdir(), 'sporeward-postgis-resistance-'));
	let now = baseline;
	let persistence: PostgresWorldPersistence | undefined;
	let app: Awaited<ReturnType<typeof createApp>> | undefined;
	let weekendResult: { id: string; response: unknown; offer: unknown; view: unknown; standings: unknown; contributions: number; footprints: number } | undefined;
	const totals = new Map<string, number>([['rider', 0]]);
	const weeks: { label: string; visits: number; points: number }[] = [];
	let visitIndex = 0;
	const headers = { 'x-sporeward-session': 'persisted-replay-rider' };
	const rebuild = async () => {
		if (app) await app.close();
		await persistence?.close();
		persistence = new PostgresWorldPersistence(databaseUrl, worldId, () => now);
		const world = new WorldStore(join(root, 'world'), () => now, tampereTestOutbreaks, {
			seed: 73,
			labAccess: cells,
			persistence,
			contributionId: contact => createHash('sha256').update(JSON.stringify(contact)).digest('hex'),
		});
		app = await createApp({
			rateLimitMax: 10000,
			worldStore: world,
			accounts: {
				authenticate: async token => token === headers['x-sporeward-session'] ? { id: 'rider', username: 'rider', name: 'Replay Rider' } : null,
				register: async () => { throw new Error('Unused in this replay.'); },
				login: async () => { throw new Error('Unused in this replay.'); },
				logout: async () => undefined,
			},
			activityStoreFor: player => new ActivityStore(join(root, 'activities'), player, () => now),
		});
		return { world, app, persistence };
	};
	try {
		let current = await rebuild();
		await current.world.view('rider');
		schemaReady = true;
		if (captureBaseline) untouchedBefore = await unrelatedCounts(allWorldIds);
		await current.persistence.transaction(() => { throw new Error('Replay world should already be initialized.'); }, async (state: Persisted) => {
			for (const target of state.engine.targets) { target.strength = 100; target.unit = 20; }
		});
		await current.world.configureResistance(true);

		const upload = async (id: string, started: number, position: { longitude: number; latitude: number }) => {
			const payload = makeRide(id, started, position);
			now = payload.activity.ended;
			const put = await current.app.inject({ method: 'PUT', url: `/activities/${id}/chunks/0`, headers, payload });
			assert.equal(put.statusCode, 200, `Activity chunk ${id} should upload.`);
			const response = await current.app.inject({ method: 'POST', url: `/activities/${id}/complete`, headers, payload: {} });
			assert.equal(response.statusCode, 200, `Activity ${id} should complete.`);
			return { payload, response: response.json(), recap: parseEncounterRecap(response.json().encounters, id) };
		};
		const rides = async (label: string, firstDay: number, lastDay: number) => {
			let visits = 0, points = 0;
			for (let offset = firstDay; offset <= lastDay; offset++) {
				for (const hour of [6, 12]) {
					const id = `${label}-${visitIndex++}`;
					const result = await upload(id, baseline + offset * day + hour * 3600000, home);
					visits += result.recap.encounters.filter(encounter => encounter.accepted).length;
					points += result.recap.confirmedVisitPoints + result.recap.confirmedCleanupPoints;
					totals.set('rider', totals.get('rider')! + result.recap.confirmedVisitPoints + result.recap.confirmedCleanupPoints);
				}
			}
			weeks.push({ label, visits, points });
		};

		// Four identical weekday blocks establish a measurable local resistance field.
		for (let week = 0; week < 4; week++) await rides(`week-${week + 1}`, week * 7, week * 7 + 4);

		const weekendStarted = baseline + 26 * day + 10 * 3600000;
		now = weekendStarted;
		let offer: unknown = null;
		if (includeLab) {
			await current.world.prepareFieldLabs();
			offer = parseFieldLabOffer((await current.app.inject({ method: 'POST', url: '/outings/weekend-lab/lab-offer', headers, payload: {} })).json());
		}
		const weekend = await upload('weekend-lab', weekendStarted, point(weekendLab.position));
		const collections = weekend.recap.labCollections ?? [];
		if (includeLab) {
			const confirmed = collections.find(result => result.status === 'confirmed');
			assert.ok(confirmed, 'The treatment outing must collect the deterministic Field Lab.');
			assert.ok(confirmed.resistanceReduction > 0, 'The collected lab must restore some measured resistance.');
			const view = await current.world.view('rider');
			assert.equal(view.fieldLabs?.find(lab => lab.id === confirmed.labId)?.collected, true);
			const contributions = await current.persistence.pool.query('SELECT count(*)::int AS count FROM sw_contributions WHERE world_id=$1', [worldId]);
			const history = await current.persistence.historicalFootprints!(baseline, now);
			weekendResult = {
				id: 'weekend-lab', response: weekend.response, offer, view,
				standings: await current.world.standings(),
				contributions: Number(contributions.rows[0].count), footprints: history.length,
			};
		}
		else assert.equal(collections.length, 0, 'The matched control outing has no lab collection.');

		if (includeLab) {
			// Rebuild both persistence adapters, then retry the completed outing and cached offer.
			current = await rebuild();
			const retry = await current.app.inject({ method: 'POST', url: '/activities/weekend-lab/complete', headers, payload: {} });
			assert.equal(retry.statusCode, 200);
			assert.deepEqual(retry.json(), weekendResult!.response);
			assert.deepEqual((await current.app.inject({ method: 'POST', url: '/outings/weekend-lab/lab-offer', headers, payload: {} })).json(), weekendResult!.offer);
			assert.deepEqual(await current.world.view('rider'), weekendResult!.view);
			assert.deepEqual(await current.world.standings(), weekendResult!.standings);
			const contributionRetry = await current.persistence.pool.query('SELECT count(*)::int AS count FROM sw_contributions WHERE world_id=$1', [worldId]);
			const historyRetry = await current.persistence.historicalFootprints!(baseline, now);
			assert.equal(Number(contributionRetry.rows[0].count), weekendResult!.contributions);
			assert.equal(historyRetry.length, weekendResult!.footprints);
		}

		await rides('following-week', 28, 32);
		const standings = await current.world.standings();
		assert.equal(standings.find(entry => entry.playerId === 'rider')?.points, totals.get('rider'));
		const final = await current.world.view('rider');
		const labResult = weekend.recap.labCollections?.find(result => result.status === 'confirmed');
		return {
			arm: includeLab ? 'weekend-lab' : 'matched-control',
			weeks,
		weekendOfferFraction: includeLab ? rounded((offer as { labs: { labId: string; fraction: number }[] }).labs.find(item => item.labId === weekendLab.id)?.fraction ?? 0) : null,
			weekendRestorationFraction: labResult ? rounded(labResult.actualFraction) : 0,
			weekendResistanceReduction: labResult ? rounded(labResult.resistanceReduction) : 0,
			followingWeekPoints: weeks.at(-1)!.points,
			points: totals.get('rider'),
			collections: collections.length,
			restartAndRetryStable: includeLab,
			persistedContactRecords: Number((await current.persistence.pool.query('SELECT count(*)::int AS count FROM sw_contributions WHERE world_id=$1', [worldId])).rows[0].count),
			postgisFootprintHistory: (await current.persistence.historicalFootprints!(baseline, now)).length,
			activeOutbreaks: final.outbreaks.filter(outbreak => outbreak.lifecycle !== 'remnant').length,
		};
	} finally {
		if (app) await app.close();
		await persistence?.close();
		await rm(root, { recursive: true, force: true });
	}
}

try {
	const connected = await basePool.query('SELECT current_database() AS name');
	const databaseName = connected.rows[0]?.name;
	assert.equal(databaseName, REPLAY_DATABASE_NAME, 'Connected database must be the dedicated replay database.');
	console.log(`Connected replay database: ${databaseName}`);
	const firstIds = newReplayWorldIds();
	const secondIds = newReplayWorldIds();
	allWorldIds.push(firstIds.control, firstIds.lab, secondIds.control, secondIds.lab);
	const collision = await basePool.query('SELECT id FROM sw_worlds WHERE id = ANY($1::text[])', [allWorldIds]).catch(error => {
		if (String(error).includes('does not exist')) return { rows: [] };
		throw error;
	});
	assert.equal(collision.rows.length, 0, 'Generated replay IDs must not exist before the run.');
	const firstControl = await runArm(firstIds.control, false, true);
	const firstLab = await runArm(firstIds.lab, true, false);
	const secondControl = await runArm(secondIds.control, false, false);
	const secondLab = await runArm(secondIds.lab, true, false);
	const stable = (arm: typeof firstControl) => ({ ...arm, arm: undefined, restartAndRetryStable: undefined });
	assert.deepEqual(stable(firstControl), stable(secondControl), 'Control aggregate must repeat deterministically.');
	assert.deepEqual(stable(firstLab), stable(secondLab), 'Lab aggregate must repeat deterministically.');
	const collected = firstLab.weekendRestorationFraction > 0 && firstLab.weekendResistanceReduction > 0;
	assert.ok(collected, 'The lab arm must have a measurable collection and restoration.');
	await cleanupReplayWorlds(basePool, allWorldIds);
	schemaReady = false;
	const untouchedAfter = await unrelatedCounts(allWorldIds);
	assert.deepEqual(untouchedAfter, untouchedBefore, 'Cleanup must preserve all unrelated world rows and records.');
	console.log(JSON.stringify({
		database: databaseName,
		fixture: 'Tampere test outbreaks and accessible Field Lab spawns, seed 73',
		inputs: { weekdayBlocks: 4, visitsPerWeekday: 2, followingWeek: true, sameSyntheticRoutes: true },
		control: firstControl,
		weekendLab: firstLab,
		deterministicAggregate: true,
		unrelatedDatabaseRowsPreserved: true,
		cleanup: 'run-scoped world IDs removed',
	}, null, 2));
} finally {
	if (schemaReady) await cleanupReplayWorlds(basePool, allWorldIds);
	await basePool.end();
}
