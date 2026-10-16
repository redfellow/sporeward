vi.mock('../../apps/mobile/src/server/client',()=>({SERVER_URL:'http://127.0.0.1:3102'}));
vi.mock('../../apps/mobile/src/server/sync',()=>({syncPendingActivities:vi.fn().mockResolvedValue(undefined)}));
vi.mock('../../apps/mobile/src/server/session',()=>({savedSession:async()=>null,recordingIdentity:async()=>'legacy-local'}));
import {beforeEach,describe,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({status:'recording' as 'recording'|'paused'|'finished',service:true,nativeService:true,section:1,position:vi.fn(),transition:vi.fn(),updated:vi.fn(),event:vi.fn(),diagnostic:vi.fn()}));
vi.mock('react-native',()=>({AppState:{currentState:'active'},Alert:{alert:vi.fn()}}));
vi.mock('expo-task-manager',()=>({defineTask:vi.fn()}));
vi.mock('expo-location',()=>({Accuracy:{BestForNavigation:6},getCurrentPositionAsync:f.position,requestForegroundPermissionsAsync:async()=>({granted:true}),getBackgroundPermissionsAsync:async()=>({granted:true}),hasStartedLocationUpdatesAsync:async()=>f.service,startLocationUpdatesAsync:async()=>{f.service=true;f.nativeService=true;},stopLocationUpdatesAsync:async()=>{f.service=false;f.nativeService=false;}}));
vi.mock('../../apps/mobile/src/recording/notification',()=>({requestNotificationPermission:async()=>true,updateNotification:f.updated,locationServiceRunning:async()=>f.nativeService}));
vi.mock('../../apps/mobile/src/recording/store',()=>({current:async()=>f.status==='finished'?null:{id:'one',status:f.status,deadline:Date.now()+10000},segments:async()=>[{id:f.section,started:1000,ended:f.status==='paused'?2000:null}],transition:async(s:typeof f.status,recovery=false,queueUpload=true)=>{f.transition(s,recovery,queueUpload);if(s==='recording' && f.status==='paused') f.section++;f.status=s;},event:f.event,diagnostic:f.diagnostic}));
import {syncPendingActivities} from '../../apps/mobile/src/server/sync';
import {applyNotificationAction,recover,pause,prepareReplayPosition} from '../../apps/mobile/src/recording/recorder';
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

 describe('isolated native replay',()=>{
 it('warms GPS without opening optional device settings or starting a recording',async()=>{
  vi.stubGlobal('__DEV__',true);f.position.mockResolvedValue({coords:{longitude:23.7,latitude:61.5}});
  try {expect(await prepareReplayPosition()).toEqual({longitude:23.7,latitude:61.5});
   expect(f.position).toHaveBeenCalledWith({accuracy:6,mayShowUserSettingsDialog:false});
   expect(f.transition).not.toHaveBeenCalled();
  }finally{vi.unstubAllGlobals();}
 });
 it('fails warm-up before recording when the receiver never produces a fix',async()=>{
  vi.stubGlobal('__DEV__',true);vi.useFakeTimers();f.position.mockReturnValue(new Promise(()=>{}));
  try{const result=expect(prepareReplayPosition()).rejects.toThrow('GPS warm-up timed out before recording.');
   await vi.advanceTimersByTimeAsync(10000);await result;expect(f.transition).not.toHaveBeenCalled();
  }finally{vi.useRealTimers();vi.unstubAllGlobals();}
 });
 it('rejects replay warm-up outside a development build',async()=>{
  vi.stubGlobal('__DEV__',false);
  try{await expect(prepareReplayPosition()).rejects.toThrow('isolated development API');expect(f.position).not.toHaveBeenCalled();}
  finally{vi.unstubAllGlobals();}
 });
 it('preserves explicit upload control when a replay finishes',async()=>{
  await pause(true,false);
  expect(f.transition).toHaveBeenCalledWith('finished',false,false);
  expect(syncPendingActivities).not.toHaveBeenCalled();
  expect(f.service).toBe(false);
 });
 it('automatically queues and synchronizes normal finishes',async()=>{
  await pause(true);
  expect(f.transition).toHaveBeenCalledWith('finished',false,true);
  expect(syncPendingActivities).toHaveBeenCalledOnce();
 });
});
