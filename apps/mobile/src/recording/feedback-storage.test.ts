/// <reference types="node" />
import {describe,it,expect} from 'vitest';
import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {CONTACT_FEEDBACK_SCHEMA,readFeedbackRows,saveFeedbackRows,type FeedbackDatabase} from './feedback-storage';
import type {ContactEntry,FeedbackScope} from './contact-feedback';
const scope:FeedbackScope={owner:'alice',activity:'outing',environment:'test-server',world:1000};
const entry:ContactEntry={kind:'lab',id:'lab',name:'Field Lab',timestamp:2000,estimate:null,reason:'unknown',consumed:true};
function adapter(db:DatabaseSync):FeedbackDatabase{return {
 async getFirstAsync<T>(sql:string,...args:(string|number|null)[]){return (db.prepare(sql).get(...args) as T)??null;},
 async getAllAsync<T>(sql:string,...args:(string|number|null)[]){return db.prepare(sql).all(...args) as T[];},
 async runAsync(sql:string,...args:(string|number|null)[]){return db.prepare(sql).run(...args);},
};}
function fixture(db:DatabaseSync){db.exec("CREATE TABLE activities(id TEXT PRIMARY KEY); CREATE TABLE activity_owners(activity TEXT PRIMARY KEY,owner TEXT); CREATE TABLE fixes(activity TEXT,timestamp REAL); CREATE TABLE contact_previews(activity TEXT,outbreak TEXT); CREATE TABLE activity_uploads(activity TEXT,receipt TEXT); INSERT INTO activities VALUES('outing'); INSERT INTO activity_owners VALUES('outing','alice'); INSERT INTO fixes VALUES('outing',123); INSERT INTO contact_previews VALUES('outing','spore'); INSERT INTO activity_uploads VALUES('outing','original receipt');");db.exec(CONTACT_FEEDBACK_SCHEMA);}
describe('local contact feedback persistence',()=>{
 it('claims a celebration once, retains the original contact, and survives SQLite reopen',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'sporeward-feedback-'));let db=new DatabaseSync(join(dir,'test.db'));
  try{
   fixture(db);let sql=adapter(db);
   expect(await saveFeedbackRows(sql,scope,[entry])).toHaveLength(1);
   expect(await saveFeedbackRows(sql,scope,[{...entry,timestamp:3000,name:'Changed map name'}])).toEqual([]);
   db.close();db=new DatabaseSync(join(dir,'test.db'));db.exec(CONTACT_FEEDBACK_SCHEMA);sql=adapter(db);
   expect(await readFeedbackRows(sql,scope)).toEqual([entry]);
   expect(await saveFeedbackRows(sql,scope,[entry])).toEqual([]);
   const confirmed={...entry,outcome:{status:'confirmed' as const,text:'Collection confirmed · resistance restored'}};
   await saveFeedbackRows(sql,scope,[confirmed]);expect((await readFeedbackRows(sql,scope))[0].outcome).toEqual(confirmed.outcome);
   expect(db.prepare('SELECT * FROM fixes').all()).toHaveLength(1);expect(db.prepare('SELECT * FROM contact_previews').all()).toHaveLength(1);
   expect(db.prepare('SELECT receipt FROM activity_uploads').get()).toMatchObject({receipt:'original receipt'});
  }finally{db.close();rmSync(dir,{recursive:true,force:true});}
 });
 it('isolates owners, worlds and environments and consumes previously unannounced rows',async()=>{
  const db=new DatabaseSync(':memory:');try{
   fixture(db);const sql=adapter(db);await saveFeedbackRows(sql,scope,[{...entry,consumed:false}]);
   expect(await saveFeedbackRows(sql,scope,[entry])).toHaveLength(1);
   expect(await readFeedbackRows(sql,{...scope,world:1001})).toEqual([]);
   expect(await readFeedbackRows(sql,{...scope,environment:'other-server'})).toEqual([]);
   await expect(readFeedbackRows(sql,{...scope,owner:'bob'})).rejects.toThrow('another account');
   await expect(saveFeedbackRows(sql,{...scope,owner:'bob'},[entry])).rejects.toThrow('another account');
   expect(await readFeedbackRows(sql,scope)).toEqual([entry]);
  }finally{db.close();}
 });
});
