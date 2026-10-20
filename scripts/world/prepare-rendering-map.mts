/** Inputs: bounded OSM map.json and complete Iidesjärvi relation/full.json, downloaded to work/rendering. */
import {readFile,writeFile} from 'node:fs/promises';
const map=JSON.parse(await readFile('work/rendering/osm.json','utf8')),lake=JSON.parse(await readFile('work/rendering/lake.json','utf8'));
const elements=new Map([...map.elements,...lake.elements].map((e:any)=>[e.type+e.id,e]));
const origin=[23.795,61.495],project=(lon:number,lat:number)=>[(lon-origin[0])*111320*Math.cos(origin[1]*Math.PI/180),(origin[1]-lat)*111320];
const points=(ids:number[])=>ids.map(id=>{const n=elements.get('node'+id);if(!n)throw new Error('Missing node '+id);return project(n.lon,n.lat);});
const relation=elements.get('relation18812986'),parts=relation.members.filter((m:any)=>m.type==='way'&&m.role==='outer').map((m:any)=>[...elements.get('way'+m.ref).nodes]);
const water=[];
while(parts.length){const chain=parts.pop();while(chain[0]!==chain.at(-1)){const i=parts.findIndex((p:number[])=>p[0]===chain.at(-1)||p.at(-1)===chain.at(-1));if(i<0)throw new Error('Open shoreline');const next=parts.splice(i,1)[0];if(next[0]!==chain.at(-1))next.reverse();chain.push(...next.slice(1));}water.push(points(chain));}
const ways=map.elements.filter((e:any)=>e.type==='way'&&e.nodes?.length>1);
const innerParts=relation.members.filter((m:any)=>m.type==='way'&&m.role==='inner').map((m:any)=>[...elements.get('way'+m.ref).nodes]);
const islands=[];
while(innerParts.length){const chain=innerParts.pop();while(chain[0]!==chain.at(-1)){const i=innerParts.findIndex((p:number[])=>p[0]===chain.at(-1)||p.at(-1)===chain.at(-1));if(i<0)throw new Error('Open island');const next=innerParts.splice(i,1)[0];if(next[0]!==chain.at(-1))next.reverse();chain.push(...next.slice(1));}islands.push(points(chain));}
// This fixture has one outer lake ring. Preserve all inner island rings.
if(water.length!==1)throw new Error('Expected a single Iidesjärvi outer ring');
const waterPolygons=[[water[0],...islands]];
const roads=ways.filter((e:any)=>e.tags?.highway).map((e:any)=>({kind:e.tags.highway,points:points(e.nodes)}));
const buildings=ways.filter((e:any)=>e.tags?.building).map((e:any)=>points(e.nodes));
const parks=ways.filter((e:any)=>e.tags?.landuse==='forest'||e.tags?.leisure==='park'||e.tags?.natural==='wood').map((e:any)=>points(e.nodes));
await writeFile('apps/web/src/rendering/tampere-map.json',JSON.stringify({origin,source:'OpenStreetMap API, Iidesjärvi relation 18812986',attribution:'© OpenStreetMap contributors · ODbL 1.0',snapshot:new Date().toISOString(),water:waterPolygons,roads,buildings,parks}));
console.log({water:water.length,roads:roads.length,buildings:buildings.length});
