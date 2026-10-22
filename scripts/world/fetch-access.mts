import {mkdir,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
const region=process.argv.includes('--region');
const bounds=region?{west:23.38,south:61.27,east:24.20,north:61.62}:{west:23.728,south:61.4745,east:23.822,north:61.5195};
const output=region?'tampere-region-access.json.gz':'tampere-access.json.gz';
let ways:any[],snapshot:string;
if(process.argv.includes('--osm-api')){
 if(region)throw new Error('Use Overpass for the regional extract; the editing API fallback is restricted to the small baseline area.');
 const elements=new Map<string,any>();
 // Small bounded extracts stay below the public API's 50,000-node limit.
 for(let y=0;y<3;y++)for(let x=0;x<3;x++){
  const west=bounds.west+(bounds.east-bounds.west)*x/3,east=bounds.west+(bounds.east-bounds.west)*(x+1)/3;
  const south=bounds.south+(bounds.north-bounds.south)*y/3,north=bounds.south+(bounds.north-bounds.south)*(y+1)/3;
  const response=await fetch(`https://api.openstreetmap.org/api/0.6/map.json?bbox=${west},${south},${east},${north}`,{signal:AbortSignal.timeout(60000)});
  if(!response.ok)throw new Error('OSM bounded extract failed: '+response.status);
  const data=await response.json();if(!Array.isArray(data.elements))throw new Error('Invalid OSM map response.');
  for(const e of data.elements)elements.set(e.type+':'+e.id,e);
  console.log(`Downloaded map section ${y*3+x+1}/9`);
 }
 const nodes=new Map([...elements.values()].filter(e=>e.type==='node').map(e=>[e.id,e]));
 ways=[...elements.values()].filter(e=>e.type==='way'&&e.tags?.highway).map(w=>({id:w.id,tags:w.tags,geometry:w.nodes.map((id:number)=>{const n=nodes.get(id);if(!n)throw new Error('Incomplete map way nodes.');return {lon:n.lon,lat:n.lat};})}));
 snapshot=new Date().toISOString();
}else{
 const query=`[out:json][timeout:60];way["highway"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});out geom;`;
 const endpoint=process.env.OVERPASS_URL??'https://overpass-api.de/api/interpreter';
 const response=await fetch(endpoint+'?'+new URLSearchParams({data:query}),{signal:AbortSignal.timeout(90000)});
 if(!response.ok)throw new Error('OSM access download failed: '+response.status+'; a bounded direct API extract is available with --osm-api.');
 const data=await response.json();if(!Array.isArray(data.elements)||data.remark)throw new Error('Incomplete OSM access response.');
 ways=data.elements.filter((w:any)=>w.type==='way'&&w.geometry?.length>1).map((w:any)=>({id:w.id,tags:w.tags,geometry:w.geometry}));snapshot=data.osm3s?.timestamp_osm_base;
}
const keys=['highway','access','foot','bicycle','construction','proposed','service'];
ways=ways.map(w=>({...w,tags:Object.fromEntries(keys.filter(k=>w.tags[k]!==undefined).map(k=>[k,w.tags[k]]))})).sort((a,b)=>a.id-b.id);
const directory=new URL('../../apps/server/data/',import.meta.url);await mkdir(directory,{recursive:true});
await writeFile(new URL(output,directory),gzipSync(JSON.stringify({version:1,bounds,source:'https://www.openstreetmap.org',license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',snapshot,ways})));
console.log(JSON.stringify({ways:ways.length,bounds,snapshot}));
