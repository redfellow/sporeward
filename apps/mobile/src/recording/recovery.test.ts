import { describe, expect, it } from 'vitest';
import type { Activity } from './store';
import { recoverySegmentEnd, recoverRecorder, resumeRecording, type RecoveryRuntime } from './recovery';
import { routeGeometry, type Fix, type Segment } from './model';

const startingActivity: Activity = {id:'recovery-1',started:900,status:'recording',deadline:86400900,ended:null};
const initialFixes: Fix[] = [
 {timestamp:1000,latitude:61.5,longitude:23.7,accuracy:5,segment:1},
 {timestamp:2000,latitude:61.5005,longitude:23.7005,accuracy:5,segment:1},
];

function fixture(options:{permission?:boolean;registered?:boolean;serviceRunning?:boolean|null;startError?:Error}={}) {
 const activity={...startingActivity};
 const fixes=initialFixes.map(fix=>({...fix}));
 const segments:Segment[]=[{id:1,activity:activity.id,started:900,ended:null}];
 const events:string[]=[];
 const transitions:Array<{status:'paused'|'recording';recovery:boolean}>=[];
 let stopped=0,started=0;
 const runtime:RecoveryRuntime={
  updateNotification:async()=>{},
  current:async()=>activity.status==='finished'?null:activity,
  replayGpsSuspended:false,
  replayAllowed:true,
  now:()=>3000,
  stopService:async()=>{stopped++;},
  backgroundLocationGranted:async()=>options.permission??true,
  locationUpdatesRegistered:async()=>options.registered??false,
  locationServiceRunning:async()=>options.serviceRunning??false,
  transition:async(status,recovery=false)=>{
   transitions.push({status,recovery});
   const open=segments.filter(segment=>segment.ended===null);
   for(const segment of open){
    const last=fixes.filter(fix=>fix.segment===segment.id).reduce<number|null>((value,fix)=>value===null?fix.timestamp:Math.max(value,fix.timestamp),null);
    segment.ended=recovery?recoverySegmentEnd(segment.started,last):3000;
   }
   if(status==='recording')segments.push({id:segments.length+1,activity:activity.id,started:3000,ended:null});
   activity.status=status;
  },
  startService:async()=>{started++;if(options.startError)throw options.startError;},
  pause:async()=>{activity.status='paused';},
  event:async message=>{events.push(message);},
  diagnostic:async()=>{},
 };
 return {runtime,activity,fixes,segments,events,transitions,get stopped(){return stopped;},get started(){return started;}};
}

describe('native recording recovery',()=>{
 it('preserves fixes and starts a separate segment after service recovery',async()=>{
  const state=fixture();
  await recoverRecorder(state.runtime);
  expect(state.activity).toMatchObject({id:startingActivity.id,status:'recording'});
  expect(state.fixes).toEqual(initialFixes);
  expect(state.segments).toEqual([
   {id:1,activity:startingActivity.id,started:900,ended:2000},
   {id:2,activity:startingActivity.id,started:3000,ended:null},
  ]);
  expect(state.events).toContain('Recording recovered; a new route segment was started.');
  const continued=[...state.fixes,
   {timestamp:4000,latitude:61.501,longitude:23.701,accuracy:5,segment:2},
   {timestamp:5000,latitude:61.5015,longitude:23.7015,accuracy:5,segment:2},
  ];
  const route=routeGeometry(continued);
  expect(route.lines.features).toHaveLength(2);
  expect(route.lines.features.map(line=>line.geometry.coordinates)).toEqual([
   [[23.7,61.5],[23.7005,61.5005]],
   [[23.701,61.501],[23.7015,61.5015]],
  ]);
  expect(route.markers.features.filter(feature=>feature.properties?.role==='start')).toHaveLength(2);
 });

 it('pauses without losing fixes when background permission is missing',async()=>{
  const state=fixture({permission:false});
  await expect(recoverRecorder(state.runtime)).rejects.toThrow('Recording paused: location permission is missing.');
  expect(state.activity).toMatchObject({id:startingActivity.id,status:'paused'});
  expect(state.fixes).toEqual(initialFixes);
  expect(state.segments[0].ended).toBe(2000);
  expect(state.segments).toHaveLength(1);
 });

 it('keeps the outing and fixes when location service restart fails',async()=>{
  const state=fixture({startError:new Error('native service unavailable')});
  const failure=await recoverRecorder(state.runtime).catch(error=>error);
  expect(failure).toBeInstanceOf(Error);
  expect((failure as Error).message).toBe('Recording paused because location service could not be started. Your outing is saved; resume when location is available.');
  expect(((failure as Error & {cause:Error}).cause).message).toBe('native service unavailable');
  expect(state.activity).toMatchObject({id:startingActivity.id,status:'paused'});
  expect(state.fixes).toEqual(initialFixes);
  expect(state.segments[0].ended).toBe(2000);
  expect(state.segments[1]).toMatchObject({id:2,started:3000,ended:3000});
  expect(state.transitions).toEqual([{status:'recording',recovery:true},{status:'paused',recovery:false}]);
 });

 it('allows explicit resume after missing permission is restored',async()=>{
  const state=fixture({permission:false});
  await expect(recoverRecorder(state.runtime)).rejects.toThrow('Recording paused: location permission is missing.');
  await resumeRecording(state.runtime.transition,state.runtime.startService);
  expect(state.activity).toMatchObject({id:startingActivity.id,status:'recording'});
  expect(state.fixes).toEqual(initialFixes);
  expect(state.segments).toEqual([
   {id:1,activity:startingActivity.id,started:900,ended:2000},
   {id:2,activity:startingActivity.id,started:3000,ended:null},
  ]);
 });
});
