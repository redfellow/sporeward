import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Alert, AppState } from 'react-native';
import { requestNotificationPermission, updateNotification, locationServiceRunning } from './notification';
import { deliveryDiagnostic } from './delivery';
import * as store from './store';
const TASK = 'sporeward-location';
TaskManager.defineTask<{locations: Location.LocationObject[]}>(TASK, async ({data,error}) => {
 const receivedAt=Date.now();
 try {
  if (error) { await store.event(`Location error: ${error.message}`); return; }
  if (data) {
   const current=await store.current();
   const previous=current ? await store.latestPoint(current.id) : undefined;
   const sections=current ? await store.segments(current.id) : [];
   const first=data.locations.reduce((t,l)=>Math.min(t,l.timestamp),Infinity);
   const sourceGapMs=previous && previous.segment===sections.at(-1)?.id && Number.isFinite(first) ? Math.max(0,first-previous.timestamp) : null;
   await store.diagnostic('location-delivery',{...deliveryDiagnostic(data.locations.map(l=>l.timestamp),receivedAt),appState:AppState.currentState,sourceGapMs});
  }
  if (data) await store.saveFixes(data.locations.map(l => ({timestamp:l.timestamp, latitude:l.coords.latitude, longitude:l.coords.longitude, accuracy:l.coords.accuracy})));
  const a = await store.current();
  if (a?.status === 'recording' && Date.now() >= a.deadline) { await store.transition('paused'); await stopService(); await store.event('24-hour recording limit reached. Resume or finish explicitly.'); await updateNotification(true); }
  await updateNotification();
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
 const notificationsAllowed=await requestNotificationPermission();
 if (resume) await store.transition('recording'); else await store.begin();
 try { await startService(); await store.event(resume ? 'Recording resumed.' : 'Recording started.'); await store.diagnostic('service-start',{resume,notificationsAllowed}); await updateNotification(true); if(!notificationsAllowed) await store.event('Recording started; notifications are disabled. Enable them in Android settings for recording controls.'); }
 catch (e) { await store.transition('paused'); throw e; }
}
export async function pause(finish = false) { await store.transition(finish ? 'finished' : 'paused'); await stopService(); await store.event(finish ? 'Activity saved.' : 'Recording paused.'); await updateNotification(true); }
export async function recover() {
 await updateNotification();
 const a = await store.current();
 if (a?.status !== 'recording') { await stopService(); await updateNotification(); return; }
 if (Date.now() >= a.deadline) { await pause(); await store.event('24-hour limit reached. Resume or finish explicitly.'); return; }
 const registered=await Location.hasStartedLocationUpdatesAsync(TASK);
 const serviceRunning=await locationServiceRunning();
 if (!registered || serviceRunning===false) {
  if (!(await Location.getBackgroundPermissionsAsync()).granted) { await store.transition('paused',true); throw new Error('Recording paused: location permission is missing.'); }
  if(registered) await stopService();
  await store.transition('recording',true);
  try { await startService(); await store.event('Recording recovered; a new route segment was started.'); await store.diagnostic('service-recovered',{registered,serviceRunning}); await updateNotification(true); }
  catch(e) { await store.transition('paused'); throw e; }
 }
}

export async function applyNotificationAction(action:import('./notification-action').NotificationAction) {
 const current=await store.current();if(!current || current.id!==action.activity) return;
 const {notificationRevision}=await import('./notification-action');
 if(action.nonce!==notificationRevision(await store.segments(current.id))) return;
 await store.diagnostic('notification-action',{action:action.action});
 if(action.action==='finish') await pause(true);
 else if(action.action==='pause' && current.status==='recording') await pause();
 else if(action.action==='resume' && current.status==='paused') await start(true);
}
