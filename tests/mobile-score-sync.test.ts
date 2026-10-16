vi.mock('react-native',()=>({AppState:{currentState:'background',addEventListener:vi.fn()}}));
vi.mock('../apps/mobile/src/server/sync-notification',()=>({uploadNotification:vi.fn()}));
import {beforeEach,describe,expect,it,vi} from 'vitest';
import {uploadNotification} from '../apps/mobile/src/server/sync-notification';
const f=vi.hoisted(()=>({credentials:vi.fn(),owner:vi.fn(),state:vi.fn(),activity:vi.fn(),mark:vi.fn(),pending:vi.fn(),upload:vi.fn()}));
vi.mock('../apps/mobile/src/server/credentials',()=>({loadCredentials:f.credentials}));
vi.mock('../apps/mobile/src/recording/store',()=>({assertOwner:f.owner,uploadState:f.state,activity:f.activity,markUpload:f.mark,pendingUploads:f.pending,setUploadRetry:vi.fn().mockResolvedValue(undefined),points:async()=>[],segments:async()=>[]}));
vi.mock('../apps/mobile/src/server/upload',()=>({uploadActivity:f.upload}));
const receipt={status:'stored',id:'outing',eligibleForGame:true,fixCount:0,distanceMetres:600,reasons:[],receivedAt:1000};
beforeEach(()=>{vi.resetModules();vi.resetAllMocks();f.credentials.mockResolvedValue({username:'gateway',password:'test',playerId:'rider',session:'disposable-session'});f.owner.mockResolvedValue(undefined);f.state.mockResolvedValue({state:'pending'});f.activity.mockResolvedValue({id:'outing',status:'finished',started:1,ended:1000});f.mark.mockResolvedValue(undefined);f.pending.mockResolvedValue([{id:'outing'}]);f.upload.mockResolvedValue(receipt);});
describe('automatic score confirmation',()=>{
 it('shares a single upload between Finish recovery and the recap',async()=>{
  const {syncActivity,syncPendingActivities}=await import('../apps/mobile/src/server/sync');
  await Promise.all([syncPendingActivities(),syncActivity('outing'),syncActivity('outing')]);
  expect(f.upload).toHaveBeenCalledTimes(1);expect(f.owner).toHaveBeenCalledWith('outing','rider');expect(f.mark).toHaveBeenLastCalledWith('outing','uploaded',receipt);
 });
 it('retains an interrupted transfer as pending and permits an explicit retry',async()=>{
  const {syncActivity}=await import('../apps/mobile/src/server/sync');f.upload.mockRejectedValueOnce(new Error('offline'));
  await expect(syncActivity('outing')).rejects.toThrow('recording is saved');expect(f.mark).toHaveBeenLastCalledWith('outing','pending',null,expect.any(String));
  await expect(syncActivity('outing')).resolves.toEqual(receipt);expect(f.upload).toHaveBeenCalledTimes(2);
 });
 it('does not resend an already confirmed outing',async()=>{
  const {syncActivity}=await import('../apps/mobile/src/server/sync');f.state.mockResolvedValue({state:'uploaded',receipt:JSON.stringify(receipt)});
  expect(await syncActivity('outing')).toEqual(receipt);expect(f.upload).not.toHaveBeenCalled();expect(f.mark).not.toHaveBeenCalled();
 });
 it('honours a saved retry deadline and keeps the pending notification',async()=>{
  const deadline=Date.now()+60000;f.pending.mockResolvedValue([{id:'outing',retryAt:deadline}]);
  const {syncPendingActivities}=await import('../apps/mobile/src/server/sync');await syncPendingActivities();
  expect(f.upload).not.toHaveBeenCalled();await vi.waitFor(()=>expect(uploadNotification).toHaveBeenLastCalledWith(1,deadline,false,false));
 });
 it('clears the notification after the final pending upload succeeds',async()=>{
  f.upload.mockImplementation(async()=>{f.pending.mockResolvedValue([]);return receipt;});
  const {syncActivity}=await import('../apps/mobile/src/server/sync');await syncActivity('outing');
  await vi.waitFor(()=>expect(uploadNotification).toHaveBeenLastCalledWith(0,0,false,false));
 });
 it('attempts the upload when the foreground countdown expires',async()=>{
  vi.useFakeTimers();const {AppState}=await import('react-native');Object.assign(AppState,{currentState:'active'});
  try{
   const deadline=Date.now()+60000;f.pending.mockResolvedValue([{id:'outing',retryAt:deadline}]);
   f.upload.mockImplementation(async()=>{f.pending.mockResolvedValue([]);return receipt;});
   const {syncPendingActivities}=await import('../apps/mobile/src/server/sync');await syncPendingActivities();
   await vi.advanceTimersByTimeAsync(0);expect(uploadNotification).toHaveBeenCalledWith(1,deadline,false,true);
   await vi.advanceTimersByTimeAsync(59999);expect(f.upload).not.toHaveBeenCalled();
   await vi.advanceTimersByTimeAsync(1);expect(f.upload).toHaveBeenCalledTimes(1);
   expect(uploadNotification).toHaveBeenLastCalledWith(0,0,false,true);
  }finally{vi.clearAllTimers();vi.useRealTimers();Object.assign(AppState,{currentState:'background'});}
 });
 it('keeps an expired account outing pending without sending an unauthenticated upload',async()=>{
  f.credentials.mockResolvedValue({username:'gateway',password:'test',playerId:'rider'});
  const {syncActivity}=await import('../apps/mobile/src/server/sync');
  await expect(syncActivity('outing')).rejects.toThrow('Sign in to your tester account again');
  expect(f.upload).not.toHaveBeenCalled();expect(f.mark).toHaveBeenLastCalledWith('outing','pending',null,expect.stringContaining('Sign in'));
 });
 it('can still read an already confirmed receipt after session expiry',async()=>{
  f.credentials.mockResolvedValue({username:'gateway',password:'test',playerId:'rider'});
  f.state.mockResolvedValue({state:'uploaded',receipt:JSON.stringify(receipt)});
  const {syncActivity}=await import('../apps/mobile/src/server/sync');
  expect(await syncActivity('outing')).toEqual(receipt);expect(f.upload).not.toHaveBeenCalled();expect(f.mark).not.toHaveBeenCalled();
 });
 it('neither uploads nor changes the outbox for another owner',async()=>{
  const {syncActivity}=await import('../apps/mobile/src/server/sync');f.owner.mockRejectedValue(new Error('wrong owner'));
  await expect(syncActivity('outing')).rejects.toThrow();expect(f.upload).not.toHaveBeenCalled();expect(f.mark).not.toHaveBeenCalled();
 });
});
