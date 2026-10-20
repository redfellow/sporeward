import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {accessCells,type AccessMap} from './access.ts';
import {generateOutbreaks} from './generate.ts';
export type TampereArea='baseline'|'urban';
export async function loadTampereAccess(area:TampereArea='baseline'){
 if(!['baseline','urban'].includes(area))throw new Error('Unknown Tampere access area.');
 const file=area==='urban'?'tampere-region-access.json.gz':'tampere-access.json.gz';
 const map:AccessMap=JSON.parse(gunzipSync(await readFile(new URL('../../data/'+file,import.meta.url))).toString('utf8'));
 if(map.version!==1||map.source!=='https://www.openstreetmap.org'||!map.snapshot||!Array.isArray(map.ways))throw new Error('Invalid Tampere access snapshot.');
 return {map,cells:accessCells(map)};
}
export async function tampereWorldFixtures(seed=73,count=20,area:TampereArea='baseline',version:3|4|5=3){
 // Startup fallback allocations stay cheap: the persisted world owns its surfaces.
 const access=await loadTampereAccess(area);return {access,fixtures:generateOutbreaks(access.cells,seed,count,new Set(),version)};
}
