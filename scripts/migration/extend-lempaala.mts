/** Add southern coverage once; never recreate the existing world or its rewards. */
import {isDeepStrictEqual} from 'node:util';
import {PostgresWorldPersistence} from '../../apps/server/src/database/world.ts';
import {databaseConnection} from '../../apps/server/src/database/config.ts';
import {loadTampereAccess} from '../../apps/server/src/spatial/tampere.ts';
import {generateOutbreaks} from '../../apps/server/src/spatial/generate.ts';
import {cellKey,tileCoordinate} from '../../apps/server/src/spatial/access.ts';
import {captureFootprint} from '../../apps/server/src/spatial/history.ts';
import {createOutbreak} from '@sporeward/game';
const url=databaseConnection(),world=process.env.WORLD_ID;
if(!url||world!=='tampere-field')throw new Error('This command requires the existing tampere-field database configuration.');
const expansion='lempaala-south-20261016',database=new PostgresWorldPersistence(url,world),access=await loadTampereAccess('urban');
if(access.map.bounds.south>61.28)throw new Error('Southern access map is missing.');
try {
 const result=await database.transaction(()=>{throw new Error('Refusing to create a missing field world.');},async s=>{
  if(s.coverageExpansions?.includes(expansion))return {alreadyExtended:true};
  if(!s.spatialRuntime||!s.footprints)throw new Error('Expected a migrated spatial world.');
  const rewards=structuredClone({scores:s.engine.scores,contributions:s.contributions,bonuses:s.bonuses,activities:s.activities});
  const occupied=new Set(s.fixtures.filter(f=>f.retiredAt===undefined).flatMap(f=>(f.cells??[]).map(cellKey)));
  const southern=access.cells.filter(c=>tileCoordinate([c.x+.5,c.y+.5])[1]<61.38);
  const now=Math.max(Date.now(),s.startedAt+s.engine.time*60000),fixtures=generateOutbreaks(southern,20261016,100,occupied,s.contourVersion??3,s.fixtures.filter(f=>f.retiredAt===undefined).map(f=>f.ring));
  for(const f of fixtures){
   if(s.fixtures.some(old=>old.id===f.id))throw new Error('Expansion identity collision.');
   const o=createOutbreak(f.id,s.engine.effort,s.engine.balance);o.deadline+=(now-s.startedAt)/60000;
   s.engine.targets.push(o);s.fixtures.push({...f,name:f.name.replace('Tampere','Lempäälä'),spawnedAt:now});
   captureFootprint(s.footprints,{id:f.id,ring:f.ring,validFrom:now,validUntil:null});
  }
  s.spatialRuntime.density=600;(s.coverageExpansions??=[]).push(expansion);
  if(!isDeepStrictEqual(rewards,{scores:s.engine.scores,contributions:s.contributions,bonuses:s.bonuses,activities:s.activities}))throw new Error('Existing rewards changed.');
  return {alreadyExtended:false,added:fixtures.length,targetDensity:600,southernAccessibleCells:southern.length,rewardsPreserved:true};
 });console.log(JSON.stringify(result));
}finally{await database.close();}
