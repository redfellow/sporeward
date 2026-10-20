import {it,expect,vi,beforeEach} from 'vitest';
import {createHash} from 'node:crypto';
import {createWorld} from '@sporeward/game';
import type {Persisted} from '../world-store';
const db=vi.hoisted(()=>({query:vi.fn(),release:vi.fn(),end:vi.fn()}));
vi.mock('pg',()=>({Pool:class{connect=async()=>db;end=db.end;query=(...args:unknown[])=>db.query(...args);}}));
import {PostgresWorldPersistence} from './world';
beforeEach(()=>{vi.clearAllMocks();});
it('saves history using compact PostGIS metadata without loading a second snapshot',async()=>{
 const footprint={id:'zone',ring:[[23.7,61.5],[23.701,61.5],[23.701,61.501]] as [number,number][],validFrom:1000,validUntil:null as number|null};
 const state:Persisted={version:1,startedAt:1000,fixtures:[],engine:createWorld({ids:[]}),footprints:[footprint],contributions:[],bonuses:{},activities:{}};
 const fingerprint=createHash('sha256').update(JSON.stringify([...footprint.ring,footprint.ring[0]])).digest('hex');
 db.query.mockImplementation(async(sql:string)=>{
  if(sql.startsWith('SELECT snapshot FROM'))return {rows:[{snapshot:structuredClone(state)}]};
  if(sql.startsWith('SELECT snapshot->>'))return {rows:[{reset_generation:null}]};
  if(sql.startsWith('SELECT outbreak_id'))return {rows:[{outbreak_id:'zone',valid_from:'1000',valid_until:null,fingerprint}]};
  return {rows:[]};
 });
 const store=new PostgresWorldPersistence('postgres://unused','test');
 await store.transaction(()=>state,async()=>undefined);
 const queries=db.query.mock.calls.map(([sql])=>sql as string);
 expect(queries.filter(sql=>sql.startsWith('SELECT snapshot FROM'))).toEqual(['SELECT snapshot FROM sw_worlds WHERE id=$1 FOR UPDATE']);
 expect(queries.some(sql=>sql.startsWith('INSERT INTO sw_footprints'))).toBe(false);
 db.query.mockClear();
 await store.transaction(()=>state,async s=>{s.footprints![0].validUntil=2000;});
 const insert=db.query.mock.calls.find(([sql])=>String(sql).startsWith('INSERT INTO sw_footprints'));
 expect(insert).toBeDefined();expect(JSON.parse(insert![1][1])).toMatchObject([{id:'zone',from:1000,until:2000,fingerprint}]);
 await store.close();
});

it('keeps old outlines archived while compacting the snapshot and batching geometry writes',async()=>{
 const ring=[[23.7,61.5],[23.701,61.5],[23.701,61.501]] as [number,number][];
 const historical=Array.from({length:300},(_,i)=>({id:'old-'+i,ring,validFrom:1000,validUntil:2000}));
 const live={id:'live',ring,validFrom:1000,validUntil:null};
 const state:Persisted={version:1,startedAt:1000,fixtures:[],engine:createWorld({ids:[]}),footprints:[...historical,live],contributions:[],bonuses:{},activities:{}};
 state.engine.time=100;
 db.query.mockImplementation(async(sql:string)=>sql.startsWith('SELECT snapshot FROM')?{rows:[{snapshot:state}]}:{rows:[]});
 const store=new PostgresWorldPersistence('postgres://unused','test',()=>4*86400000);
 await store.transaction(()=>state,async()=>undefined);
 const snapshot=db.query.mock.calls.find(([sql])=>String(sql).startsWith('INSERT INTO sw_worlds'))![1][1];
 expect(snapshot.footprints).toEqual([live]);expect(state.footprints).toHaveLength(301);
 const batches=db.query.mock.calls.filter(([sql])=>String(sql).startsWith('INSERT INTO sw_footprints')).map(call=>JSON.parse(call[1][1]));
 expect(batches.map(batch=>batch.length)).toEqual([256,45]);expect(batches.flat().map(f=>f.id)).toContain('old-299');
 expect(db.query.mock.calls.some(([sql])=>String(sql).startsWith('DELETE'))).toBe(false);
 await store.close();
});
it('loads an explicitly requested historical interval from archived PostGIS geometry',async()=>{
 db.query.mockImplementation(async(sql:string)=>sql.startsWith('SELECT outbreak_id')?{rows:[{outbreak_id:'archived',valid_from:'1000',valid_until:'2000',shape:{type:'Polygon',coordinates:[[[23,61],[24,61],[24,62],[23,61]]]}}]}:{rows:[]});
 const store=new PostgresWorldPersistence('postgres://unused','test');
 expect(await store.historicalFootprints(1200,1900)).toEqual([{id:'archived',validFrom:1000,validUntil:2000,ring:[[23,61],[24,61],[24,62]]}]);
 expect(db.query.mock.calls.find(([sql])=>String(sql).startsWith('SELECT outbreak_id'))![1]).toEqual(['test',1200,1900]);
 await store.close();
});
