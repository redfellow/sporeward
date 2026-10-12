import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('expo-sqlite', () => ({ openDatabaseAsync: async () => {
 const db = new DatabaseSync(':memory:');
 const adapter = {
  execAsync: async (sql:string) => {db.exec(sql);},
  runAsync: async (sql:string,...args:(string|number|null)[]) => db.prepare(sql).run(...args),
  getFirstAsync: async (sql:string,...args:(string|number|null)[]) => db.prepare(sql).get(...args) ?? null,
  getAllAsync: async (sql:string,...args:(string|number|null)[]) => db.prepare(sql).all(...args),
  withExclusiveTransactionAsync: async (fn:(tx:unknown)=>Promise<void>) => { db.exec('BEGIN'); try {await fn(adapter);db.exec('COMMIT');} catch(e) {db.exec('ROLLBACK');throw e;} }
 };
 return adapter;
}}));
beforeEach(() => {vi.resetModules();vi.spyOn(Date,'now').mockReturnValue(1000000);});
afterEach(()=>vi.restoreAllMocks());
describe('durable recorder storage', () => {
 it('keeps late fixes from before pause, excludes paused travel, and deduplicates timestamps',async()=> {
  const s = await import('../../apps/mobile/src/recording/store'); const id = await s.begin();
  const f = {timestamp:1001000,latitude:61.5,longitude:23.7,accuracy:5};
  vi.mocked(Date.now).mockReturnValue(1002000);await s.transition('paused');
  vi.mocked(Date.now).mockReturnValue(1005000);await s.saveFixes([f,f,{...f,timestamp:1003000}]);
  expect(await s.points(id)).toHaveLength(1);
  await s.transition('recording'); vi.mocked(Date.now).mockReturnValue(1007000);
  await s.saveFixes([{...f,timestamp:1006000}]);
  const p = await s.points(id);expect(p).toHaveLength(2);expect(p[0].segment).not.toBe(p[1].segment);
  await s.transition('finished');expect(await s.current()).toBeNull();expect(await s.points(id)).toHaveLength(2);
 });
 it('preserves the original deadline when recovering an interrupted recording',async()=> {
  const s=await import('../../apps/mobile/src/recording/store'); await s.begin();const original=(await s.current())!;
  vi.mocked(Date.now).mockReturnValue(2000000);await s.transition('recording',true);
  expect((await s.current())!.deadline).toBe(original.deadline);
  await expect(s.begin()).rejects.toThrow('unfinished');
 });
});
