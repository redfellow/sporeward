/** Add offline-generated base surfaces only. API migration owns boundary intervals. */
import {readFile} from 'node:fs/promises';
import {PostgresWorldPersistence} from '../../apps/server/src/database/world.ts';
import {databaseConnection} from '../../apps/server/src/database/config.ts';
import type {Coordinate} from '@sporeward/protocol';
const path=process.argv.find(a=>a.startsWith('--apply='))?.slice(8),world=process.env.WORLD_ID,url=databaseConnection();
if(!path||!url||world!=='tampere-field')throw new Error('Use --apply=OFFLINE_SURFACES with the existing field database configuration.');
const raw:unknown=JSON.parse(await readFile(path,'utf8'));
if(!Array.isArray(raw)||raw.length>10000)throw new Error('Invalid surface file.');
const surfaces=new Map<string,Coordinate[]>();
for(const entry of raw){
 if(!entry||typeof entry.id!=='string'||!entry.id||surfaces.has(entry.id)||!Array.isArray(entry.surface)||entry.surface.length<3||entry.surface.length>480||!entry.surface.every((p:unknown)=>Array.isArray(p)&&p.length===2&&p.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=255)))throw new Error('Invalid normalized surface.');
 surfaces.set(entry.id,entry.surface);
}
const database=new PostgresWorldPersistence(url,world);
try{
 const result=await database.transaction(()=>{throw new Error('Existing field world required.');},async state=>{
  let added=0;for(const f of state.fixtures){const surface=surfaces.get(f.id);if(!f.surface&&surface){f.surface=surface;added++;}}
  return {added,provided:surfaces.size,contourVersion:state.contourVersion??null};
 });
 console.log(JSON.stringify(result));
}finally{await database.close();}
