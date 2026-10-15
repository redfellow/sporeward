import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {PostgresWorldPersistence} from '../../apps/server/src/database/world.ts';
import {parseWorldSnapshot} from '../../apps/server/src/database/import.ts';
import {WorldStore} from '../../apps/server/src/world-store.ts';
import {tampereWorldFixtures} from '../../apps/server/src/spatial/tampere.ts';
const file=process.argv[2],id=process.argv.find(a=>a.startsWith('--world='))?.slice(8),url=process.env.DATABASE_URL;
if(!file||!id||!url)throw new Error('Provide a private snapshot, --world=PREVIEW_NAMESPACE and DATABASE_URL.');
const raw=await readFile(file),source=parseWorldSnapshot(JSON.parse(raw.toString())),database=new PostgresWorldPersistence(url,id),{fixtures,access}=await tampereWorldFixtures();
try{
 await database.importSnapshot(source,createHash('sha256').update(raw).digest('hex'));
 const world=new WorldStore('',Date.now,()=>fixtures,{persistence:database,spatial:access.cells,seed:73});const result=await world.prepareSpatialWorld();
 const stored=(await database.pool.query('SELECT snapshot FROM sw_worlds WHERE id=$1',[id])).rows[0].snapshot;
 const oldIds=source.contributions.map(c=>c.id);if(!oldIds.every(id=>stored.contributions.some((c:{id:string})=>c.id===id)))throw new Error('Contribution identity changed.');
 for(const f of source.fixtures)if(!stored.fixtures.some((p:{id:string})=>p.id===f.id))throw new Error('Legacy outbreak identity lost.');
 const owner=source.contributions[0]?.player;if(owner){const view=await world.view(owner);if(!view.outbreaks.some(o=>source.fixtures.some(f=>f.id===o.id)))throw new Error('Legacy world not retained.');}
 console.log(JSON.stringify({...result,preservedContributions:oldIds.length,legacyOutbreaks:source.fixtures.length,scoresUnchanged:isDeepStrictEqual(stored.engine.scores,source.engine.scores)}));
}finally{await database.close();}
