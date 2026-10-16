vi.mock('../../apps/mobile/src/server/sync',()=>({syncPendingActivities:vi.fn().mockResolvedValue(undefined)}));
vi.mock('../../apps/mobile/src/server/session',()=>({savedSession:async()=>null}));
import {beforeEach,describe,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({status:'recording' as 'recording'|'paused'|'finished',service:true,nativeService:true,section:1,updated:vi.fn(),event:vi.fn(),diagnostic:vi.fn()}));
vi.mock('react-native',()=>({AppState:{currentState:'active'},Alert:{alert:vi.fn()}}));
vi.mock('expo-task-manager',()=>({defineTask:vi.fn()}));
vi.mock('expo-location',()=>({Accuracy:{BestForNavigation:6},requestForegroundPermissionsAsync:async()=>({granted:true}),getBackgroundPermissionsAsync:async()=>({granted:true}),hasStartedLocationUpdatesAsync:async()=>f.service,startLocationUpdatesAsync:async()=>{f.service=true;f.nativeService=true;},stopLocationUpdatesAsync:async()=>{f.service=false;f.nativeService=false;}}));
vi.mock('../../apps/mobile/src/recording/notification',()=>({requestNotificationPermission:async()=>true,updateNotification:f.updated,locationServiceRunning:async()=>f.nativeService}));
vi.mock('../../apps/mobile/src/recording/store',()=>({current:async()=>f.status==='finished'?null:{id:'one',status:f.status,deadline:Date.now()+10000},segments:async()=>[{id:f.section,started:1000,ended:f.status==='paused'?2000:null}],transition:async(s:typeof f.status)=>{if(s==='recording' && f.status==='paused') f.section++;f.status=s;},event:f.event,diagnostic:f.diagnostic}));
import {applyNotificationAction,recover} from '../../apps/mobile/src/recording/recorder';
beforeEach(()=>{f.status='recording';f.service=true;f.nativeService=true;f.section=1;vi.clearAllMocks();});
describe('notification controls',()=> {
 it('pauses GPS, resumes GPS, and saves a finished activity',async()=> {
  await applyNotificationAction({activity:'one',action:'pause',nonce:'1:1000'});expect(f.status).toBe('paused');expect(f.service).toBe(false);
  await applyNotificationAction({activity:'one',action:'resume',nonce:'1:2000'});expect(f.status).toBe('recording');expect(f.service).toBe(true);
  await applyNotificationAction({activity:'one',action:'finish',nonce:'2:1000'});expect(f.status).toBe('finished');expect(f.service).toBe(false);
 });
 it('ignores controls from another outing and does not resume a paused recording on recovery',async()=> {
  await applyNotificationAction({activity:'old',action:'finish',nonce:'1'});expect(f.status).toBe('recording');
  f.status='paused';await recover();expect(f.status).toBe('paused');expect(f.service).toBe(false);
 });
 it('ignores an old notification action after the outing changes section',async()=> {
  f.section=2;await applyNotificationAction({activity:'one',action:'pause',nonce:'1:1000'});expect(f.status).toBe('recording');
 });
 it('restarts a stopped foreground service even when Expo retains task registration',async()=> {
  f.nativeService=false;await recover();expect(f.nativeService).toBe(true);expect(f.diagnostic).toHaveBeenCalledWith('service-recovered',{registered:true,serviceRunning:false});
 });
 it('recovers a missing service for an active recording',async()=> {
  f.service=false;await recover();expect(f.status).toBe('recording');expect(f.service).toBe(true);expect(f.diagnostic).toHaveBeenCalledWith('service-recovered',{registered:false,serviceRunning:true});
 });
});
