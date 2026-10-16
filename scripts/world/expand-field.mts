import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {isDeepStrictEqual} from 'node:util';
import {createOutbreak} from '@sporeward/game';
import {parseWorldSnapshot} from '../../apps/server/src/database/import.ts';
import {accessCells,cellKey,tilePosition,type AccessMap} from '../../apps/server/src/spatial/access.ts';
import {generateOutbreaks} from '../../apps/server/src/spatial/generate.ts';
import {tampereTestOutbreaks} from '../../apps/server/src/test-outbreaks.ts';
const [source,destination]=process.argv.slice(2);
if(!source||!destination||source===destination)throw new Error('Provide separate source and output snapshot paths. Stop the field API before applying output.');
const state=parseWorldSnapshot(JSON.parse(await readFile(source,'utf8')));
if(state.fixtures.some(f=>f.id.startsWith('urban-region-')))throw new Error('Regional expansion already applied.');
const before=structuredClone({targets:state.engine.targets,contributions:state.contributions,bonuses:state.bonuses,activities:state.activities,scores:state.engine.scores});
const map:AccessMap=JSON.parse(gunzipSync(await readFile(new URL('../../apps/server/data/tampere-region-access.json.gz',import.meta.url))).toString('utf8'));
const access=accessCells(map),known=tampereTestOutbreaks();
const blocked=new Set<string>();
for(const f of state.fixtures){
 const cells=f.cells??known.find(k=>k.id===f.id)?.cells;
 if(cells)for(const c of cells)blocked.add(cellKey(c));
 else for(const p of f.ring){const [x,y]=tilePosition(p);blocked.add(cellKey({x:Math.floor(x),y:Math.floor(y)}));}
}
const at=Date.now(),minute=Math.max(state.engine.time,Math.floor((at-state.startedAt)/60000));
const additions=generateOutbreaks(access,15102026,495,blocked);
state.footprints??=state.fixtures.map(f=>({id:f.id,ring:f.ring,validFrom:f.spawnedAt??state.startedAt,validUntil:null}));
for(const [i,f] of additions.entries()){
 f.id=`urban-region-20261015-${i+1}`;f.name=`Urban spore ${String(i+1).padStart(3,'0')}`;
 const target=createOutbreak(f.id,state.engine.effort,state.engine.balance);target.deadline+=minute;
 state.engine.targets.push(target);state.fixtures.push({...f,spawnedAt:at});state.footprints.push({id:f.id,ring:f.ring,validFrom:at,validUntil:null});
}
const after={targets:state.engine.targets.slice(0,before.targets.length),contributions:state.contributions,bonuses:state.bonuses,activities:state.activities,scores:state.engine.scores};
if(!isDeepStrictEqual(before,after))throw new Error('Existing field state changed; refusing output.');
parseWorldSnapshot(state);await writeFile(destination,JSON.stringify(state),{mode:0o600,flag:'wx'});
console.log(JSON.stringify({preserved:before.targets.length,added:additions.length,total:state.fixtures.length,accessibleCells:access.length,bounds:map.bounds,createdAt:at}));
