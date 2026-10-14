import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {accessCells,type AccessMap} from './access.ts';
import {generateOutbreaks} from './generate.ts';
export async function loadTampereAccess(){
 const map:AccessMap=JSON.parse(gunzipSync(await readFile(new URL('../../data/tampere-access.json.gz',import.meta.url))).toString('utf8'));
 if(map.version!==1||map.source!=='https://www.openstreetmap.org'||!map.snapshot||!Array.isArray(map.ways))throw new Error('Invalid Tampere access snapshot.');
 return {map,cells:accessCells(map)};
}
export async function tampereWorldFixtures(seed=73,count=20){
 const access=await loadTampereAccess();return {access,fixtures:generateOutbreaks(access.cells,seed,count)};
}
