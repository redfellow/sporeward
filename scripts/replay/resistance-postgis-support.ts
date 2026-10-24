import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';

export const REPLAY_DATABASE_NAME = 'sporeward_replay';

/** Require a dedicated replay URL; never inherit the field server's DATABASE_URL. */
export function replayDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
	const value = env.REPLAY_DATABASE_URL;
	if (!value) throw new Error('Set REPLAY_DATABASE_URL to the dedicated sporeward_replay database.');
	let url: URL;
	try { url = new URL(value); } catch { throw new Error('REPLAY_DATABASE_URL must be a valid PostgreSQL URL.'); }
	if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('REPLAY_DATABASE_URL must use PostgreSQL.');
	if (decodeURIComponent(url.pathname.slice(1)) !== REPLAY_DATABASE_NAME) {
		throw new Error(`REPLAY_DATABASE_URL must target the dedicated ${REPLAY_DATABASE_NAME} database.`);
	}
	return value;
}

export function newReplayWorldIds() {
	const run = randomUUID().replaceAll('-', '');
	return { run, control: `sr-${run}-control`, lab: `sr-${run}-lab` };
}

export type ReplayPool = Pick<Pool, 'connect'>;

/** Delete only rows bearing the IDs allocated by this run, respecting foreign keys. */
export async function cleanupReplayWorlds(pool: ReplayPool, worldIds: readonly string[]) {
	if (!worldIds.length || worldIds.some(id => !/^sr-[a-f0-9]{32}-(?:control|lab)$/.test(id)) || new Set(worldIds).size !== worldIds.length) {
		throw new Error('Refusing cleanup without unique run-scoped world IDs.');
	}
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		for (const table of ['sw_bonus_owners', 'sw_contributions', 'sw_footprints', 'sw_world_imports', 'sw_worlds']) {
			await client.query(`DELETE FROM ${table} WHERE world_id = ANY($1::text[])`, [worldIds]);
		}
		await client.query('COMMIT');
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally { client.release(); }
}
