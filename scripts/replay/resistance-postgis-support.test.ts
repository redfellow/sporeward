import { describe, expect, it, vi } from 'vitest';
import { cleanupReplayWorlds, newReplayWorldIds, replayDatabaseUrl } from './resistance-postgis-support.ts';

describe('persisted resistance replay isolation', () => {
	it('requires the explicit dedicated database URL even when DATABASE_URL exists', () => {
		expect(() => replayDatabaseUrl({ DATABASE_URL: 'postgres://field/sporeward' } as NodeJS.ProcessEnv)).toThrow('REPLAY_DATABASE_URL');
		expect(() => replayDatabaseUrl({ REPLAY_DATABASE_URL: 'postgres://localhost/sporeward' } as NodeJS.ProcessEnv)).toThrow('dedicated sporeward_replay');
		expect(replayDatabaseUrl({ REPLAY_DATABASE_URL: 'postgres://localhost/sporeward_replay' } as NodeJS.ProcessEnv)).toBe('postgres://localhost/sporeward_replay');
	});

	it('allocates distinct run-scoped world IDs', () => {
		const first = newReplayWorldIds(), second = newReplayWorldIds();
		expect(new Set([first.control, first.lab, second.control, second.lab]).size).toBe(4);
		expect(first.control).toMatch(/^sr-[a-f0-9]{32}-control$/);
		expect(first.lab).toMatch(/^sr-[a-f0-9]{32}-lab$/);
	});

	it('cleans only the allocated IDs and refuses unscoped IDs', async () => {
		const query = vi.fn(async () => ({ rows: [] }));
		const release = vi.fn();
		const pool = { connect: async () => ({ query, release }) } as never;
		const ids = [newReplayWorldIds().control, newReplayWorldIds().lab];
		await cleanupReplayWorlds(pool, ids);
		const deletes = query.mock.calls.filter(([sql]) => String(sql).startsWith('DELETE'));
		expect(deletes).toHaveLength(5);
		expect(deletes.map(([sql]) => sql)).toEqual([
			'DELETE FROM sw_bonus_owners WHERE world_id = ANY($1::text[])',
			'DELETE FROM sw_contributions WHERE world_id = ANY($1::text[])',
			'DELETE FROM sw_footprints WHERE world_id = ANY($1::text[])',
			'DELETE FROM sw_world_imports WHERE world_id = ANY($1::text[])',
			'DELETE FROM sw_worlds WHERE id = ANY($1::text[])',
		]);
		for (const [, values] of deletes) expect(values).toEqual([ids]);
		expect(query.mock.calls.at(-1)?.[0]).toBe('COMMIT');
		expect(release).toHaveBeenCalledOnce();
		await expect(cleanupReplayWorlds(pool, ['native-field-labs'])).rejects.toThrow('Refusing cleanup');
	});

	it('rolls back a partially failed cleanup transaction', async () => {
		const query = vi.fn(async (sql: string) => {
			if (sql.startsWith('DELETE FROM sw_footprints')) throw new Error('fixture failure');
			return { rows: [] };
		});
		const pool = { connect: async () => ({ query, release: vi.fn() }) } as never;
		const ids = newReplayWorldIds();
		await expect(cleanupReplayWorlds(pool, [ids.control, ids.lab])).rejects.toThrow('fixture failure');
		expect(query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
	});
});
