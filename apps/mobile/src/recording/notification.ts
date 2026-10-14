import { requireOptionalNativeModule } from 'expo';
import { PermissionsAndroid, Platform } from 'react-native';
import * as store from './store';
import { notificationRevision } from './notification-action';
import { recordingDuration, summarize } from './model';
const native = requireOptionalNativeModule<{publish(id:string,state:string,elapsed:number,meters:number,revision:string):Promise<boolean>;clear():Promise<void>;locationServiceRunning():Promise<boolean>}>('RecorderNotification');
let lastPublished = 0;
let queue=Promise.resolve();
export async function requestNotificationPermission() {
 if(Platform.OS !== 'android' || Number(Platform.Version)<33) return true;
 return await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS) === PermissionsAndroid.RESULTS.GRANTED;
}
export function updateNotification(force=false) {
 queue=queue.then(()=>publish(force)).catch(async e=>{await store.event(`Recording notification unavailable: ${String(e)}`);});
 return queue;
}
async function publish(force:boolean) {
 if(!native) return;
 const now=Date.now();if(!force && now-lastPublished<5000) return;
 const a=await store.current();if(!a) {await native.clear();lastPublished=now;return;}
 const [fixes,sections]=await Promise.all([store.points(a.id),store.segments(a.id)]);
 try {if(await native.publish(a.id,a.status,recordingDuration(sections,now),summarize(fixes).meters,notificationRevision(sections))) lastPublished=now;}
 catch(e) {lastPublished=now;await store.event(`Recording notification unavailable: ${String(e)}`);}
}

export async function locationServiceRunning():Promise<boolean|null> {
 return native ? await native.locationServiceRunning() : null;
}
