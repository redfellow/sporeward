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
 it('closes a recovered empty section at its own start, preserving valid upload boundaries',async()=> {
  const s=await import('../../apps/mobile/src/recording/store');const id=await s.begin();
  vi.mocked(Date.now).mockReturnValue(1005000);await s.transition('paused');
  vi.mocked(Date.now).mockReturnValue(1010000);await s.transition('recording');
  vi.mocked(Date.now).mockReturnValue(1020000);await s.transition('recording',true);
  const sections=await s.segments(id);expect(sections[1].ended).toBe(sections[1].started);expect(sections[2].started).toBe(1020000);
 });

 it('persists activity-specific diagnostics, including after finishing, independently of GPS coordinates',async()=> {
  const s=await import('../../apps/mobile/src/recording/store');const id=await s.begin();
  await s.diagnostic('app-state',{state:'background'});await s.transition('finished');
  await s.diagnostic('delivery',{receivedAt:1003000,count:2},id);
  expect(await s.recordingDiagnostics(id)).toEqual([
   {time:1000000,kind:'app-state',data:{state:'background'}},
   {time:1000000,kind:'delivery',data:{receivedAt:1003000,count:2}}
  ]);
  expect(await s.points(id)).toEqual([]);
 });
 it('serializes concurrent GPS batches, lifecycle events, diagnostics and pause without losing fixes',async()=> {
  const s=await import('../../apps/mobile/src/recording/store');const id=await s.begin();
  vi.mocked(Date.now).mockReturnValue(1005000);
  const fix={timestamp:1001000,latitude:61.5,longitude:23.7,accuracy:5};
  await Promise.all([
   s.saveFixes([fix]),s.event('Background'),s.diagnostic('app-state',{state:'background'}),
   s.saveFixes([{...fix,timestamp:1002000}]),s.transition('paused'),s.markUpload(id,'pending')
  ]);
  expect(await s.points(id)).toHaveLength(2);expect((await s.current())!.status).toBe('paused');
  expect(await s.recordingDiagnostics(id)).toHaveLength(1);expect((await s.uploadState(id))!.state).toBe('pending');
 });
 it('continues accepting writes after a rejected operation',async()=> {
  const s=await import('../../apps/mobile/src/recording/store');await s.begin();await expect(s.begin()).rejects.toThrow('unfinished');
  await s.event('Still working');expect((await s.lastEvent())!.message).toBe('Still working');await s.transition('finished');expect(await s.current()).toBeNull();
 });

});

it('keeps local outings assigned to their recording account',async()=>{
 const s=await import('../../apps/mobile/src/recording/store');const alice=await s.begin('alice');await s.transition('finished');
 vi.mocked(Date.now).mockReturnValue(1001000);const bob=await s.begin('bob');await s.transition('finished');
 expect((await s.recent('alice')).map(a=>a.id)).toEqual([alice]);expect((await s.recent('bob')).map(a=>a.id)).toEqual([bob]);
 await expect(s.assertOwner(alice,'alice')).resolves.toBeUndefined();await expect(s.assertOwner(alice,'bob')).rejects.toThrow('another account');
 expect(await s.points(alice)).toEqual([]);
});
it('explicit legacy transfer preserves GPS, sections and receipts without taking another account data',async()=>{
 const s=await import('../../apps/mobile/src/recording/store'),legacy=await s.begin();
 vi.mocked(Date.now).mockReturnValue(1001000);await s.saveFixes([{timestamp:1000500,latitude:61.5,longitude:23.7,accuracy:5}]);await s.transition('finished');await s.markUpload(legacy,'uploaded',{id:legacy,confirmedPoints:100});
 vi.mocked(Date.now).mockReturnValue(1002000);const other=await s.begin('bob');await s.transition('finished');
 vi.mocked(Date.now).mockReturnValue(1003000);await s.begin('alice');await expect(s.claimLegacyActivities('alice')).rejects.toThrow('active outing');await s.transition('finished');
 const points=await s.points(legacy),sections=await s.segments(legacy),receipt=await s.uploadState(legacy);
 expect(await s.legacyActivityCount()).toBe(1);expect(await s.claimLegacyActivities('alice')).toBe(1);expect(await s.claimLegacyActivities('alice')).toBe(0);
 expect(await s.points(legacy)).toEqual(points);expect(await s.segments(legacy)).toEqual(sections);expect(await s.uploadState(legacy)).toEqual(receipt);
 await expect(s.assertOwner(legacy,'alice')).resolves.toBeUndefined();await expect(s.assertOwner(other,'bob')).resolves.toBeUndefined();expect(await s.legacyActivityCount()).toBe(0);
});
