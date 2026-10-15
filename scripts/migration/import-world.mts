import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {PostgresWorldPersistence} from '../../apps/server/src/database/world.ts';
import {parseWorldSnapshot} from '../../apps/server/src/database/import.ts';
const source=process.argv[2],worldId=process.argv.find(a=>a.startsWith('--world='))?.slice(8),url=process.env.DATABASE_URL;
if(!source||!worldId||!url)throw new Error('Provide a private snapshot path, --world=DESTINATION and DATABASE_URL.');
const raw=await readFile(source),state=parseWorldSnapshot(JSON.parse(raw.toString('utf8'))),hash=createHash('sha256').update(raw).digest('hex');
const database=new PostgresWorldPersistence(url,worldId);
try{
 const result=await database.importSnapshot(state,hash);
 const stored=await database.pool.query('SELECT snapshot FROM sw_worlds WHERE id=$1',[worldId]);
 if(!result.alreadyImported&&!isDeepStrictEqual(stored.rows[0].snapshot,state))throw new Error('Imported snapshot differs from the source.');
 console.log(JSON.stringify({world:worldId,...result,sourceHash:hash,outbreaks:state.fixtures.length,contributions:state.contributions.length,activities:Object.keys(state.activities).length}));
}finally{await database.close();}
