import * as SQLite from 'expo-sqlite';
import { Fix, validFix } from './model';
export type Activity = { id: string; started: number; status: 'recording' | 'paused' | 'finished'; deadline: number; ended: number | null };
const dbPromise = SQLite.openDatabaseAsync('sporeward-recorder.db').then(async db => {
 await db.execAsync(`PRAGMA busy_timeout = 5000;
 PRAGMA journal_mode = WAL;
 CREATE TABLE IF NOT EXISTS activities (id TEXT PRIMARY KEY, started REAL, status TEXT, deadline REAL, ended REAL);
 CREATE TABLE IF NOT EXISTS segments (id INTEGER PRIMARY KEY AUTOINCREMENT, activity TEXT, started REAL, ended REAL);
 CREATE TABLE IF NOT EXISTS fixes (activity TEXT, segment INTEGER, timestamp REAL, latitude REAL, longitude REAL, accuracy REAL, PRIMARY KEY(activity,timestamp));
 UPDATE segments SET ended=started WHERE ended < started;
 CREATE TABLE IF NOT EXISTS activity_owners (activity TEXT PRIMARY KEY, owner TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS activity_uploads (activity TEXT PRIMARY KEY, state TEXT, receipt TEXT, error TEXT);
 CREATE TABLE IF NOT EXISTS upload_retries (activity TEXT PRIMARY KEY, next_attempt REAL NOT NULL);
 CREATE TABLE IF NOT EXISTS events (time REAL, message TEXT);
 CREATE TABLE IF NOT EXISTS contact_previews (activity TEXT, outbreak TEXT, touched REAL, points INTEGER, PRIMARY KEY(activity,outbreak));
 CREATE TABLE IF NOT EXISTS world_cache (owner TEXT PRIMARY KEY, snapshot TEXT);
 CREATE TABLE IF NOT EXISTS lab_offers (owner TEXT, activity TEXT, offer TEXT NOT NULL, PRIMARY KEY(owner,activity));
 CREATE TABLE IF NOT EXISTS recording_diagnostics (time REAL, activity TEXT, kind TEXT, data TEXT);`);
 return db;
});
// Exclusive transactions use another native connection. Queue all local writes so
// diagnostics/UI work cannot contend with a GPS batch. A failed write must not poison the queue.
let writer=Promise.resolve();
function write<T>(operation:()=>Promise<T>):Promise<T> {
 const next=writer.then(operation);writer=next.then(()=>{},()=>{});return next;
}
async function transaction(operation:(tx:SQLite.SQLiteDatabase)=>Promise<void>) {
 const db=await dbPromise;
 await db.withExclusiveTransactionAsync(async tx=> {
  await tx.execAsync('PRAGMA busy_timeout = 5000;');
  // Reserve the writer before reading the snapshot; also protects separate JS runtimes.
  await tx.runAsync('UPDATE activities SET status=status WHERE 0');
  await operation(tx);
 });
}
export async function activity(id:string) {return (await dbPromise).getFirstAsync<Activity>('SELECT * FROM activities WHERE id = ?',id);}
export async function pendingUploads(owner:string) {return (await dbPromise).getAllAsync<Activity & {retryAt:number|null}>("SELECT a.*,r.next_attempt AS retryAt FROM activities a JOIN activity_uploads u ON u.activity=a.id LEFT JOIN activity_owners o ON o.activity=a.id LEFT JOIN upload_retries r ON r.activity=a.id WHERE a.status='finished' AND u.state='pending' AND COALESCE(o.owner,'legacy-local')=? ORDER BY a.started",owner);}
export async function current() { return (await dbPromise).getFirstAsync<Activity>("SELECT * FROM activities WHERE status != 'finished' ORDER BY started DESC LIMIT 1"); }
export async function recent(owner?:string) { if(owner)return (await dbPromise).getAllAsync<Activity>("SELECT a.* FROM activities a LEFT JOIN activity_owners o ON o.activity=a.id WHERE COALESCE(o.owner,'legacy-local')=? ORDER BY a.started DESC LIMIT 8",owner);return (await dbPromise).getAllAsync<Activity>('SELECT * FROM activities ORDER BY started DESC LIMIT 8'); }
export async function points(id: string) { return (await dbPromise).getAllAsync<Fix>('SELECT timestamp, latitude, longitude, accuracy, segment FROM fixes WHERE activity = ? ORDER BY timestamp', id); }
export function event(message: string) { const time=Date.now();return write(async()=>{await (await dbPromise).runAsync('INSERT INTO events VALUES (?,?)',time,message);}); }
export async function lastEvent() { return (await dbPromise).getFirstAsync<{message: string}>('SELECT message FROM events ORDER BY time DESC LIMIT 1'); }
export function begin(owner='legacy-local') { if(!owner||owner.length>150)throw new Error('Invalid recording owner.'); return write(async()=> {
 const now = Date.now(), id = `${now}-${Math.random().toString(36).slice(2)}`;
 await transaction(async tx => {
  if (await tx.getFirstAsync("SELECT id FROM activities WHERE status != 'finished'")) throw new Error('An unfinished activity already exists.');
  await tx.runAsync('INSERT INTO activities VALUES (?,?,?,?,NULL)', id, now, 'recording', now+86400000);
  await tx.runAsync('INSERT INTO activity_owners VALUES (?,?)',id,owner);
  await tx.runAsync('INSERT INTO segments(activity,started) VALUES (?,?)', id, now);
 });
 return id;
 });
}
export function transition(status: 'paused' | 'finished' | 'recording', recovery = false, queueUpload = true) { return write(async()=> {
 const now = Date.now();
 await transaction(async tx => {
  const a = await tx.getFirstAsync<Activity>("SELECT * FROM activities WHERE status != 'finished' LIMIT 1");
  if (!a) return;
  if (status === a.status && !recovery) return;
  // If the native service disappeared, avoid connecting the last fix to the new session.
  if(recovery) await tx.runAsync('UPDATE segments SET ended = MAX(started,COALESCE((SELECT MAX(timestamp) FROM fixes WHERE fixes.segment=segments.id AND fixes.activity=segments.activity),started)) WHERE activity = ? AND ended IS NULL',a.id);
  else await tx.runAsync('UPDATE segments SET ended = ? WHERE activity = ? AND ended IS NULL',now,a.id);
  if (status === 'recording') await tx.runAsync('INSERT INTO segments(activity,started) VALUES (?,?)', a.id, now);
  await tx.runAsync('UPDATE activities SET status = ?, ended = ?, deadline = ? WHERE id = ?', status, status === 'finished' ? now : null, status === 'recording' && !recovery ? now+86400000 : a.deadline, a.id);
  if(status==='finished'&&queueUpload)await tx.runAsync("INSERT INTO activity_uploads(activity,state,receipt,error) VALUES (?,'pending',NULL,NULL) ON CONFLICT(activity) DO NOTHING",a.id);
 });
 });
}
export function saveFixes(batch: Omit<Fix,'segment'>[]) { return write(async()=> {
 const now = Date.now();
 await transaction(async tx => {
  for (const f of batch) {
   if (!validFix({...f,segment:0}, now)) continue;
   const s = await tx.getFirstAsync<{id:number;activity:string}>(`SELECT s.id,s.activity FROM segments s JOIN activities a ON a.id=s.activity WHERE s.started <= ? AND (s.ended IS NULL OR s.ended >= ?) AND a.deadline >= ? ORDER BY s.started DESC LIMIT 1`, f.timestamp,f.timestamp,f.timestamp);
   if (s) await tx.runAsync('INSERT OR IGNORE INTO fixes VALUES (?,?,?,?,?,?)',s.activity,s.id,f.timestamp,f.latitude,f.longitude,f.accuracy);
  }
 });
 });
}
export async function segments(id: string) { return (await dbPromise).getAllAsync<import('./model').Segment>('SELECT * FROM segments WHERE activity = ? ORDER BY started', id); }
export async function diagnostics(a: Activity) { return (await dbPromise).getAllAsync<{time:number;message:string}>('SELECT * FROM events WHERE time >= ? AND time <= ? ORDER BY time',a.started,a.ended ?? Date.now()); }

export async function uploadRetry(id:string) {return (await (await dbPromise).getFirstAsync<{next_attempt:number}>('SELECT next_attempt FROM upload_retries WHERE activity=?',id))?.next_attempt??0;}
export function setUploadRetry(id:string,at:number) {return write(async()=>{await (await dbPromise).runAsync('INSERT INTO upload_retries VALUES (?,?) ON CONFLICT(activity) DO UPDATE SET next_attempt=excluded.next_attempt',id,at);});}
export type UploadState={activity:string;state:'pending'|'uploaded';receipt:string|null;error:string|null};
export async function uploadState(id:string) {return (await dbPromise).getFirstAsync<UploadState>('SELECT * FROM activity_uploads WHERE activity = ?',id);}
export function markUpload(id:string,state:UploadState['state'],receipt:unknown=null,error:string|null=null) {return write(async()=> {await (await dbPromise).runAsync('INSERT INTO activity_uploads VALUES (?,?,?,?) ON CONFLICT(activity) DO UPDATE SET state=excluded.state,receipt=excluded.receipt,error=excluded.error',id,state,receipt===null?null:JSON.stringify(receipt),error);if(state==='uploaded')await (await dbPromise).runAsync('DELETE FROM upload_retries WHERE activity=?',id);});}

export function diagnostic(kind:string,data:Record<string,unknown>,activityId?:string) { const time=Date.now();return write(async()=> {
 const activity=activityId ?? (await current())?.id;
 if(!activity) return;
 await (await dbPromise).runAsync('INSERT INTO recording_diagnostics VALUES (?,?,?,?)',time,activity,kind,JSON.stringify(data));
 });
}
export async function recordingDiagnostics(id:string) {
 const rows=await (await dbPromise).getAllAsync<{time:number;kind:string;data:string}>('SELECT time,kind,data FROM recording_diagnostics WHERE activity=? ORDER BY time',id);
 return rows.map(r=>({...r,data:JSON.parse(r.data) as Record<string,unknown>}));
}

export async function latestPoint(id:string) {return (await dbPromise).getFirstAsync<Fix>('SELECT timestamp,latitude,longitude,accuracy,segment FROM fixes WHERE activity=? ORDER BY timestamp DESC LIMIT 1',id);}

export async function cachedWorld(owner:string) {const row=await (await dbPromise).getFirstAsync<{snapshot:string}>('SELECT snapshot FROM world_cache WHERE owner=?',owner);return row?JSON.parse(row.snapshot) as unknown:null;}
export function cacheWorld(owner:string,snapshot:unknown){return write(async()=>{await (await dbPromise).runAsync('INSERT INTO world_cache VALUES (?,?) ON CONFLICT(owner) DO UPDATE SET snapshot=excluded.snapshot',owner,JSON.stringify(snapshot));});}

export async function assertOwner(id:string,owner:string){
 const row=await (await dbPromise).getFirstAsync<{owner:string}>("SELECT COALESCE(o.owner,'legacy-local') AS owner FROM activities a LEFT JOIN activity_owners o ON o.activity=a.id WHERE a.id=?",id);
 if(!row||row.owner!==owner)throw new Error('This outing belongs to another account. Sign in with its recording account.');
}

export async function legacyActivityCount(){
 const row=await (await dbPromise).getFirstAsync<{count:number}>("SELECT COUNT(*) AS count FROM activities a LEFT JOIN activity_owners o ON o.activity=a.id WHERE COALESCE(o.owner,'legacy-local')='legacy-local' AND a.status='finished'");return row?.count??0;
}
/** Explicitly confirmed owner migration. GPS, IDs, receipts and timing remain intact. */
export function claimLegacyActivities(owner:string){
 if(!owner||owner==='legacy-local'||owner.length>150)throw new Error('A linked tester account is required.');
 return write(async()=>{let count=0;await transaction(async tx=>{
  if(await tx.getFirstAsync("SELECT id FROM activities WHERE status!='finished' LIMIT 1"))throw new Error('Finish the active outing before transferring earlier recordings.');
  const result=await tx.runAsync("INSERT INTO activity_owners(activity,owner) SELECT a.id,? FROM activities a LEFT JOIN activity_owners o ON o.activity=a.id WHERE COALESCE(o.owner,'legacy-local')='legacy-local' AND a.status='finished' ON CONFLICT(activity) DO UPDATE SET owner=excluded.owner WHERE activity_owners.owner='legacy-local'",owner);count=result.changes;
 });return count;});
}

/** Local observations only: never submitted as authoritative contacts or rewards. */
export async function contactPreviews(id:string){
 return (await dbPromise).getAllAsync<import('./encounters').ContactPreview>('SELECT outbreak AS outbreakId,touched AS timestamp,points AS visitPoints FROM contact_previews WHERE activity=? ORDER BY touched,outbreak',id);
}
export function rememberContacts(id:string,contacts:import('./encounters').ContactPreview[]){
 return write(async()=>{await transaction(async tx=>{
  if(!await tx.getFirstAsync('SELECT id FROM activities WHERE id=?',id))throw new Error('Unknown outing.');
  for(const c of contacts){
   if(!c.outbreakId||!Number.isFinite(c.timestamp)||!Number.isSafeInteger(c.visitPoints)||c.visitPoints<0)throw new Error('Invalid local contact preview.');
   await tx.runAsync('INSERT INTO contact_previews VALUES (?,?,?,?) ON CONFLICT(activity,outbreak) DO UPDATE SET touched=excluded.touched,points=excluded.points WHERE excluded.touched<contact_previews.touched',id,c.outbreakId,c.timestamp,c.visitPoints);
  }
 });});
}

export async function cachedLabOffer(owner:string,id:string):Promise<unknown|null> {
 const row=await (await dbPromise).getFirstAsync<{offer:string}>('SELECT offer FROM lab_offers WHERE owner=? AND activity=?',owner,id);
 return row?JSON.parse(row.offer):null;
}
export async function cacheLabOffer(owner:string,id:string,offer:unknown){return write(async()=>{await (await dbPromise).runAsync('INSERT OR REPLACE INTO lab_offers(owner,activity,offer) VALUES(?,?,?)',owner,id,JSON.stringify(offer));});}
