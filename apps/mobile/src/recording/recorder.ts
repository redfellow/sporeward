import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Alert } from 'react-native';
import * as store from './store';
const TASK = 'sporeward-location';
TaskManager.defineTask<{locations: Location.LocationObject[]}>(TASK, async ({data,error}) => {
 try {
  if (error) { await store.event(`Location error: ${error.message}`); return; }
  if (data) await store.saveFixes(data.locations.map(l => ({timestamp:l.timestamp, latitude:l.coords.latitude, longitude:l.coords.longitude, accuracy:l.coords.accuracy})));
  const a = await store.current();
  if (a?.status === 'recording' && Date.now() >= a.deadline) { await store.transition('paused'); await stopService(); await store.event('24-hour recording limit reached. Resume or finish explicitly.'); }
 } catch (e) { await store.event(`Recording error: ${String(e)}`); }
});
async function permissions() {
 const fg = await Location.requestForegroundPermissionsAsync();
 if (!fg.granted || fg.android?.accuracy === 'coarse') throw new Error('Precise location permission is required. Enable it in Android app settings.');
 if (!(await Location.getBackgroundPermissionsAsync()).granted) {
  await new Promise<void>((resolve,reject) => Alert.alert('Record with the screen locked', 'In Android settings, allow location all the time. Your route stays on this phone. Recording uses an ongoing notification.', [{text:'Cancel',onPress:()=>reject(new Error('Location setup cancelled.'))},{text:'Continue',onPress:()=>resolve()}], {cancelable:false}));
  if (!(await Location.requestBackgroundPermissionsAsync()).granted) throw new Error('Allow location all the time to record in the background.');
 }
}
async function startService() {
 await Location.startLocationUpdatesAsync(TASK, {accuracy:Location.Accuracy.BestForNavigation,timeInterval:1000,distanceInterval:0,pausesUpdatesAutomatically:false,foregroundService:{notificationTitle:'Sporeward is recording',notificationBody:'Open Sporeward to pause or finish your activity.',killServiceOnDestroy:false}});
}
export async function stopService() { if (await Location.hasStartedLocationUpdatesAsync(TASK)) await Location.stopLocationUpdatesAsync(TASK); }
export async function start(resume = false) {
 await permissions();
 if (resume) await store.transition('recording'); else await store.begin();
 try { await startService(); await store.event(resume ? 'Recording resumed.' : 'Recording started.'); }
 catch (e) { await store.transition('paused'); throw e; }
}
export async function pause(finish = false) { await store.transition(finish ? 'finished' : 'paused'); await stopService(); await store.event(finish ? 'Activity saved.' : 'Recording paused.'); }
export async function recover() {
 const a = await store.current();
 if (a?.status !== 'recording') { await stopService(); return; }
 if (Date.now() >= a.deadline) { await pause(); await store.event('24-hour limit reached. Resume or finish explicitly.'); return; }
 if (!(await Location.hasStartedLocationUpdatesAsync(TASK))) {
  if (!(await Location.getBackgroundPermissionsAsync()).granted) { await store.transition('paused',true); throw new Error('Recording paused: location permission is missing.'); }
  await store.transition('recording',true);
  try { await startService(); await store.event('Recording recovered; a new route segment was started.'); }
  catch(e) { await store.transition('paused'); throw e; }
 }
}
