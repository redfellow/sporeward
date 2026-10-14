import type {ReplayTrack,RecordedFix} from '@sporeward/protocol';
export type NativeReplayEvent={at:number;order:number;action:'fix'|'pause'|'resume'|'gps-off'|'gps-on';fix?:RecordedFix};
/** Normal-speed recorder plan. Pauses come from sections; sparse samples within
 * a section become simulated delivery outages, never interpolated positions.
 */
export function nativeReplayPlan(track:ReplayTrack,fromMs=0,durationMs=track.ended-track.started){
 if(!Number.isSafeInteger(fromMs)||fromMs<0||!Number.isSafeInteger(durationMs)||durationMs<=0)throw new Error('Invalid native replay window.');
 const start=track.started+fromMs,end=Math.min(track.ended,start+durationMs);
 const fixes=track.fixes.filter(f=>f.timestamp>=start&&f.timestamp<=end);
 if(!fixes.length)throw new Error('Selected replay window contains no GPS fixes.');
 let first=fixes[0];
 for(const fix of track.fixes){if(fix.timestamp>start)break;first=fix;}
 const events:NativeReplayEvent[]=fixes.map(f=>({at:f.timestamp-start,order:0,action:'fix',fix:f}));
 const sections=track.sections.filter(s=>s.started<=end&&s.ended>=start);
 for(const section of sections){
  if(section.started>start)events.push({at:section.started-start,order:2,action:'resume'});
  if(section.ended<end)events.push({at:Math.max(0,section.ended-start),order:3,action:'pause'});
 }
 for(let i=1;i<track.fixes.length;i++){
  const a=track.fixes[i-1],b=track.fixes[i];if(a.segment!==b.segment||b.timestamp-a.timestamp<=2000)continue;
  const off=a.timestamp+1000;
  if(off>end||b.timestamp<=start)continue;
  events.push({at:Math.max(0,off-start),order:1,action:'gps-off'});
  if(b.timestamp<=end)events.push({at:b.timestamp-start,order:1,action:'gps-on'});
 }
 return {durationMs:end-start,initiallyPaused:!sections.some(s=>s.started<=start&&s.ended>=start),first,events:events.sort((a,b)=>a.at-b.at||a.order-b.order)};
}
