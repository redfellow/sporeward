import * as SQLite from 'expo-sqlite';
import { Fix, validFix } from './model';
export type Activity = { id: string; started: number; status: 'recording' | 'paused' | 'finished'; deadline: number; ended: number | null };
const dbPromise = SQLite.openDatabaseAsync('sporeward-recorder.db').then(async db => {
 await db.execAsync(`PRAGMA journal_mode = WAL;
 CREATE TABLE IF NOT EXISTS activities (id TEXT PRIMARY KEY, started REAL, status TEXT, deadline REAL, ended REAL);
 CREATE TABLE IF NOT EXISTS segments (id INTEGER PRIMARY KEY AUTOINCREMENT, activity TEXT, started REAL, ended REAL);
 CREATE TABLE IF NOT EXISTS fixes (activity TEXT, segment INTEGER, timestamp REAL, latitude REAL, longitude REAL, accuracy REAL, PRIMARY KEY(activity,timestamp));
 CREATE TABLE IF NOT EXISTS events (time REAL, message TEXT);`);
 return db;
});
export async function current() { return (await dbPromise).getFirstAsync<Activity>("SELECT * FROM activities WHERE status != 'finished' ORDER BY started DESC LIMIT 1"); }
export async function recent() { return (await dbPromise).getAllAsync<Activity>('SELECT * FROM activities ORDER BY started DESC LIMIT 8'); }
export async function points(id: string) { return (await dbPromise).getAllAsync<Fix>('SELECT timestamp, latitude, longitude, accuracy, segment FROM fixes WHERE activity = ? ORDER BY timestamp', id); }
export async function event(message: string) { await (await dbPromise).runAsync('INSERT INTO events VALUES (?,?)', Date.now(), message); }
export async function lastEvent() { return (await dbPromise).getFirstAsync<{message: string}>('SELECT message FROM events ORDER BY time DESC LIMIT 1'); }
export async function begin() {
 const db = await dbPromise, now = Date.now(), id = `${now}-${Math.random().toString(36).slice(2)}`;
 await db.withExclusiveTransactionAsync(async tx => {
  if (await tx.getFirstAsync("SELECT id FROM activities WHERE status != 'finished'")) throw new Error('An unfinished activity already exists.');
  await tx.runAsync('INSERT INTO activities VALUES (?,?,?,?,NULL)', id, now, 'recording', now+86400000);
  await tx.runAsync('INSERT INTO segments(activity,started) VALUES (?,?)', id, now);
 });
 return id;
}
export async function transition(status: 'paused' | 'finished' | 'recording', recovery = false) {
 const db = await dbPromise, now = Date.now();
 await db.withExclusiveTransactionAsync(async tx => {
  const a = await tx.getFirstAsync<Activity>("SELECT * FROM activities WHERE status != 'finished' LIMIT 1");
  if (!a) return;
  if (status === a.status && !recovery) return;
  // If the native service disappeared, avoid connecting the last fix to the new session.
  const last = recovery ? await tx.getFirstAsync<{timestamp:number}>('SELECT MAX(timestamp) timestamp FROM fixes WHERE activity = ?', a.id) : null;
  await tx.runAsync('UPDATE segments SET ended = ? WHERE activity = ? AND ended IS NULL', recovery ? last?.timestamp ?? a.started : now, a.id);
  if (status === 'recording') await tx.runAsync('INSERT INTO segments(activity,started) VALUES (?,?)', a.id, now);
  await tx.runAsync('UPDATE activities SET status = ?, ended = ?, deadline = ? WHERE id = ?', status, status === 'finished' ? now : null, status === 'recording' && !recovery ? now+86400000 : a.deadline, a.id);
 });
}
export async function saveFixes(batch: Omit<Fix,'segment'>[]) {
 const db = await dbPromise, now = Date.now();
 await db.withExclusiveTransactionAsync(async tx => {
  for (const f of batch) {
   if (!validFix({...f,segment:0}, now)) continue;
   const s = await tx.getFirstAsync<{id:number;activity:string}>(`SELECT s.id,s.activity FROM segments s JOIN activities a ON a.id=s.activity WHERE s.started <= ? AND (s.ended IS NULL OR s.ended >= ?) AND a.deadline >= ? ORDER BY s.started DESC LIMIT 1`, f.timestamp,f.timestamp,f.timestamp);
   if (s) await tx.runAsync('INSERT OR IGNORE INTO fixes VALUES (?,?,?,?,?,?)',s.activity,s.id,f.timestamp,f.latitude,f.longitude,f.accuracy);
  }
 });
}
export async function segments(id: string) { return (await dbPromise).getAllAsync<import('./model').Segment>('SELECT * FROM segments WHERE activity = ? ORDER BY started', id); }
export async function diagnostics(a: Activity) { return (await dbPromise).getAllAsync<{time:number;message:string}>('SELECT * FROM events WHERE time >= ? AND time <= ? ORDER BY time',a.started,a.ended ?? Date.now()); }
