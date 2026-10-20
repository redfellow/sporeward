/** Offline only: freeze snapshot time and migrate a private in-memory copy. */
import {readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {WorldStore,type Persisted} from '../../apps/server/src/world-store.ts';
import {loadTampereAccess} from '../../apps/server/src/spatial/tampere.ts';
import type {WorldPersistence} from '../../apps/server/src/database/world.ts';
const path=process.argv[2];
if(!path)throw new Error('Usage: node --import tsx scripts/migration/preview-shorelines.mts PRIVATE_SNAPSHOT.json');
const state=JSON.parse(await readFile(path,'utf8')) as Persisted;
if(state.version!==1||!Array.isArray(state.fixtures)||!state.engine)throw new Error('Invalid world snapshot.');
const protectedData=()=>JSON.stringify({scores:state.engine.scores,contributions:state.contributions,bonuses:state.bonuses,activities:state.activities});
const before=protectedData(),time=state.startedAt+state.engine.time*60000;
const persistence:WorldPersistence={transaction:async(_initial,operation)=>operation(state)};
const access=await loadTampereAccess('urban');
const world=new WorldStore('/unused',()=>time,()=>[],{spatial:access.cells,persistence});
const start=performance.now(),organic=await world.prepareOrganicContours(),organicMs=performance.now()-start;
const shoreStart=performance.now(),shorelines=await world.prepareShorelines(),shorelineMs=performance.now()-shoreStart;
if(protectedData()!==before)throw new Error('Migration changed protected gameplay data.');
console.log(JSON.stringify({fixtures:state.fixtures.length,organic,organicMs:Math.round(organicMs),shorelines,shorelineMs:Math.round(shorelineMs),gameplayDataUnchanged:true,peakRssMiB:Math.round(process.resourceUsage().maxRSS/1024),snapshotBytes:Buffer.byteLength(JSON.stringify(state))}));
