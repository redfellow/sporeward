import {contactKey,mergeContactEntries,type ContactEntry,type FeedbackScope} from './contact-feedback';

export const CONTACT_FEEDBACK_SCHEMA=`CREATE TABLE IF NOT EXISTS contact_feedback (
 owner TEXT NOT NULL,activity TEXT NOT NULL,environment TEXT NOT NULL,world REAL NOT NULL,
 target TEXT NOT NULL,body TEXT NOT NULL,PRIMARY KEY(owner,activity,environment,world,target));`;
type Value=string|number|null;
export type FeedbackDatabase={
 getFirstAsync:<T>(sql:string,...params:Value[])=>Promise<T|null>;
 getAllAsync:<T>(sql:string,...params:Value[])=>Promise<T[]>;
 runAsync:(sql:string,...params:Value[])=>Promise<unknown>;
};
const params=(s:FeedbackScope)=>[s.owner,s.activity,s.environment,s.world];
const WHERE='owner=? AND activity=? AND environment=? AND world=?';
async function checkOwner(db:FeedbackDatabase,s:FeedbackScope){
 if(!s.owner||!s.activity||!s.environment||!Number.isFinite(s.world)||s.world<0)throw new Error('Invalid feedback context.');
 const row=await db.getFirstAsync<{owner:string}>("SELECT COALESCE(o.owner,'legacy-local') AS owner FROM activities a LEFT JOIN activity_owners o ON o.activity=a.id WHERE a.id=?",s.activity);
 if(row?.owner!==s.owner)throw new Error('This outing belongs to another account.');
}
export async function readFeedbackRows(db:FeedbackDatabase,scope:FeedbackScope){
 await checkOwner(db,scope);
 const rows=await db.getAllAsync<{body:string}>(`SELECT body FROM contact_feedback WHERE ${WHERE}`,...params(scope));
 return mergeContactEntries([],rows.map(row=>JSON.parse(row.body) as ContactEntry),null,scope.activity);
}
/** Call inside the recorder's serialized exclusive transaction. Claims are persisted before UI emits. */
export async function saveFeedbackRows(db:FeedbackDatabase,scope:FeedbackScope,entries:ContactEntry[]){
 await checkOwner(db,scope);const claimed:ContactEntry[]=[];
 for(const entry of entries){
  if(!entry.id||!entry.name||!Number.isFinite(entry.timestamp)||!['outbreak','lab'].includes(entry.kind)||entry.estimate!==null&&(!Number.isSafeInteger(entry.estimate)||entry.estimate<0))throw new Error('Invalid contact feedback.');
  const target=contactKey(entry),row=await db.getFirstAsync<{body:string}>(`SELECT body FROM contact_feedback WHERE ${WHERE} AND target=?`,...params(scope),target);
  const old:ContactEntry|null=row?JSON.parse(row.body):null;
  const merged=mergeContactEntries(old?[old]:[],[entry],null,scope.activity)[0],body=JSON.stringify(merged);
  if(!old?.consumed&&merged.consumed)claimed.push(merged);
  if(row?.body!==body)await db.runAsync(`INSERT INTO contact_feedback VALUES(?,?,?,?,?,?) ON CONFLICT(owner,activity,environment,world,target) DO UPDATE SET body=excluded.body`,...params(scope),target,body);
 }
 return claimed;
}
