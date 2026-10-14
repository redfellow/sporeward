import type {EncounterRecap} from './world';
export const UPLOAD_BATCH_SIZE=1000;
export const MAX_ACTIVITY_FIXES=100000;
export type RecordedFix={timestamp:number;latitude:number;longitude:number;accuracy:number|null;segment:number};
export type RecordedSection={id:number;started:number;ended:number};
export type ActivityChunk={activity:{id:string;started:number;ended:number;sections:RecordedSection[]};totalFixes:number;chunkCount:number;fixes:RecordedFix[]};
export type ActivityReceipt={id:string;status:'stored';fixCount:number;distanceMetres:number;eligibleForGame:boolean;reasons:string[];receivedAt:number;encounters?:EncounterRecap};
const record=(x:unknown):x is Record<string,unknown>=>typeof x==='object'&&x!==null&&!Array.isArray(x);
const integer=(x:unknown):x is number=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=0;
const finite=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);
const keys=(x:Record<string,unknown>,expected:string[])=>Object.keys(x).length===expected.length&&expected.every(k=>Object.hasOwn(x,k));
export function parseActivityChunk(value:unknown,id:string,index:number):ActivityChunk {
 const fail=():never=>{throw new Error('Invalid activity batch.');};
 if(!/^[A-Za-z0-9-]{1,100}$/.test(id)||!integer(index)||!record(value)||!keys(value,['activity','totalFixes','chunkCount','fixes'])) return fail();
 const a=value.activity;
 if(!record(a)||!keys(a,['id','started','ended','sections'])||a.id!==id||!integer(a.started)||!integer(a.ended)||a.started<=0||a.ended<a.started||!Array.isArray(a.sections)||a.sections.length>256) return fail();
 const sections:RecordedSection[]=[],ids=new Set<number>();let previousEnd=a.started;
 for(const s of a.sections) {
  if(!record(s)||!keys(s,['id','started','ended'])||!integer(s.id)||!integer(s.started)||!integer(s.ended)||ids.has(s.id)||s.started<previousEnd||s.ended<s.started||s.ended>a.ended) return fail();
  sections.push({id:s.id,started:s.started,ended:s.ended});ids.add(s.id);previousEnd=s.ended;
 }
 if(!integer(value.totalFixes)||value.totalFixes>MAX_ACTIVITY_FIXES||!integer(value.chunkCount)||value.chunkCount!==Math.max(1,Math.ceil(value.totalFixes/UPLOAD_BATCH_SIZE))||index>=value.chunkCount||!Array.isArray(value.fixes)||value.fixes.length!==Math.min(UPLOAD_BATCH_SIZE,Math.max(0,value.totalFixes-index*UPLOAD_BATCH_SIZE))) return fail();
 const fixes:RecordedFix[]=[];let last=-1;
 for(const f of value.fixes) {
  if(!record(f)||!keys(f,['timestamp','latitude','longitude','accuracy','segment'])||!integer(f.timestamp)||f.timestamp<=last||!finite(f.latitude)||Math.abs(f.latitude)>90||!finite(f.longitude)||Math.abs(f.longitude)>180||!(f.accuracy===null||finite(f.accuracy)&&f.accuracy>=0)||!integer(f.segment)) return fail();
  const section=sections.find(s=>s.id===f.segment);
  if(!section||f.timestamp<section.started||f.timestamp>section.ended) return fail();
  fixes.push({timestamp:f.timestamp,latitude:f.latitude,longitude:f.longitude,accuracy:f.accuracy,segment:f.segment});last=f.timestamp;
 }
 return {activity:{id,started:a.started,ended:a.ended,sections},totalFixes:value.totalFixes,chunkCount:value.chunkCount,fixes};
}
export function activityReceipt(activity:ActivityChunk['activity'],fixes:RecordedFix[],now:number):ActivityReceipt {
 let distanceMetres=0;
 for(let i=1;i<fixes.length;i++) {
  const a=fixes[i-1],b=fixes[i],gap=b.timestamp-a.timestamp;
  if(gap<=0) throw new Error('Activity timestamps must be unique and increasing.');
  if(a.segment!==b.segment||gap>2000) continue;
  const rad=Math.PI/180,h=Math.sin((b.latitude-a.latitude)*rad/2)**2+Math.cos(a.latitude*rad)*Math.cos(b.latitude*rad)*Math.sin((b.longitude-a.longitude)*rad/2)**2;
  distanceMetres+=6371000*2*Math.asin(Math.sqrt(Math.min(1,h)));
 }
 const reasons:string[]=[];
 if(distanceMetres<500) reasons.push('below-minimum-distance');
 if(now-activity.ended>86400000) reasons.push('outside-upload-window');
 if(activity.ended>now+30000) reasons.push('future-activity');
 return {id:activity.id,status:'stored',fixCount:fixes.length,distanceMetres,eligibleForGame:reasons.length===0,reasons,receivedAt:now};
}
