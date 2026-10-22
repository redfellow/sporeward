/** Bounded OSM editing-API fallback: append only the missing southern strip. */
import {readFile,writeFile} from 'node:fs/promises';
import {gzipSync,gunzipSync} from 'node:zlib';
import type {AccessMap,AccessWay} from '../../apps/server/src/spatial/access.ts';
const file=new URL('../../apps/server/data/tampere-region-access.json.gz',import.meta.url);
const map:AccessMap=JSON.parse(gunzipSync(await readFile(file)).toString());
if(map.bounds.south<=61.27){console.log('Southern access strip already present.');process.exit(0);}
if(map.bounds.south!==61.38)throw new Error('Unexpected previous regional bounds.');
const ways=new Map(map.ways.map(w=>[w.id,w])),south=61.27,north=map.bounds.south;
for(let y=0;y<4;y++)for(let x=0;x<6;x++){
 const west=map.bounds.west+(map.bounds.east-map.bounds.west)*x/6,east=map.bounds.west+(map.bounds.east-map.bounds.west)*(x+1)/6;
 const bottom=south+(north-south)*y/4,top=south+(north-south)*(y+1)/4;
 const response=await fetch(`https://api.openstreetmap.org/api/0.6/map.json?bbox=${west},${bottom},${east},${top}`,{signal:AbortSignal.timeout(60000)});
 if(!response.ok)throw new Error('Bounded southern OSM extract failed: '+response.status);
 const data=await response.json();if(!Array.isArray(data.elements))throw new Error('Invalid OSM response.');
 const nodes=new Map(data.elements.filter((e:any)=>e.type==='node').map((e:any)=>[e.id,e]));
 for(const w of data.elements.filter((e:any)=>e.type==='way'&&e.tags?.highway)){
  const geometry=w.nodes.map((id:number)=>{const n=nodes.get(id) as any;if(!n)throw new Error('Missing OSM way node.');return {lon:n.lon,lat:n.lat};});
  const keys=['highway','access','foot','bicycle','construction','proposed','service'];
  ways.set(w.id,{id:w.id,tags:Object.fromEntries(keys.filter(k=>w.tags[k]!==undefined).map(k=>[k,w.tags[k]])),geometry} as AccessWay);
 }
 console.log(`Southern access section ${y*6+x+1}/24`);
}
await writeFile(file,gzipSync(JSON.stringify({...map,bounds:{...map.bounds,south},extensionSnapshot:new Date().toISOString(),ways:[...ways.values()].sort((a,b)=>a.id-b.id)})));
console.log(JSON.stringify({ways:ways.size,bounds:{...map.bounds,south}}));
