import {parseActivityChunk,UPLOAD_BATCH_SIZE,type ActivityChunk,type RecordedFix,type RecordedSection} from './activities';
export type ReplayTrack={version:1;source:{name:string;sha256:string;format:'fit'|'gpx'|'tcx'|'json'};started:number;ended:number;sections:RecordedSection[];fixes:RecordedFix[];events:{timestamp:number;kind:'pause'|'resume'}[];summary:Record<string,number>};
export function parseReplayTrack(value:unknown):ReplayTrack {
 if(!value||typeof value!=='object')throw new Error('Invalid replay track.');
 const v=value as ReplayTrack;
 if(v.version!==1||!v.source||typeof v.source.name!=='string'||!/^[a-f0-9]{64}$/.test(v.source.sha256)||!['fit','gpx','tcx','json'].includes(v.source.format)||!Array.isArray(v.fixes)||!v.fixes.length||!Array.isArray(v.sections)||!Array.isArray(v.events)||!v.summary||typeof v.summary!=='object'||Object.values(v.summary).some(n=>typeof n!=='number'||!Number.isFinite(n)||n<0))throw new Error('Invalid replay track.');
 const chunkCount=Math.ceil(v.fixes.length/UPLOAD_BATCH_SIZE),activity={id:'replay-'+v.source.sha256.slice(0,20),started:v.started,ended:v.ended,sections:v.sections};
 for(let index=0;index<chunkCount;index++)parseActivityChunk({activity,totalFixes:v.fixes.length,chunkCount,fixes:v.fixes.slice(index*UPLOAD_BATCH_SIZE,(index+1)*UPLOAD_BATCH_SIZE)},activity.id,index);
 for(let i=1;i<v.fixes.length;i++)if(v.fixes[i].timestamp<=v.fixes[i-1].timestamp)throw new Error('Replay timestamps must increase.');
 let previous=v.started;
 for(const event of v.events){if(!event||!Number.isSafeInteger(event.timestamp)||event.timestamp<previous||event.timestamp>v.ended||!['pause','resume'].includes(event.kind))throw new Error('Invalid replay timer event.');previous=event.timestamp;}
 return v;
}
/** Preserve all relative times. Replay speed changes execution, never GPS timestamps. */
export function rebaseReplay(track:ReplayTrack,start:number,id:string):ActivityChunk {
 if(!Number.isSafeInteger(start)||start<=0)throw new Error('Invalid replay baseline.');
 const shift=start-track.started;
 const chunkCount=Math.ceil(track.fixes.length/UPLOAD_BATCH_SIZE);
 const payload={activity:{id,started:start,ended:track.ended+shift,sections:track.sections.map(s=>({...s,started:s.started+shift,ended:s.ended+shift}))},totalFixes:track.fixes.length,chunkCount,fixes:track.fixes.map(f=>({...f,timestamp:f.timestamp+shift}))};
 // Validate the rebased range and identity before any simulator can submit it.
 parseActivityChunk({...payload,fixes:payload.fixes.slice(0,UPLOAD_BATCH_SIZE)},id,0);
 return payload;
}
