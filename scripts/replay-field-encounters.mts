/** Private diagnostic replay: never copies the recorded route into the repository.
 * Usage: npx tsx scripts/replay-field-encounters.mts /absolute/path/to/upload-payload.json
 */
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {WorldStore} from '../apps/server/src/world-store.ts';
import {activityReceipt,type ActivityChunk} from '@sporeward/protocol';
const path=process.argv[2];if(!path)throw new Error('Supply a private recorded upload payload.');
const payload=JSON.parse(await readFile(path,'utf8')) as ActivityChunk;
const dir=await mkdtemp(join(tmpdir(),'sporeward-field-replay-'));let now=payload.activity.started-60000;
try {
 const world=new WorldStore(dir,()=>now);await world.view('field-replay');now=payload.activity.ended+60000;
 const receipt=activityReceipt(payload.activity,payload.fixes,now);
 const first=await world.process('field-replay',payload.activity,payload.fixes,receipt);
 const retry=await new WorldStore(dir,()=>now).process('field-replay',payload.activity,payload.fixes,receipt);assert.deepEqual(retry,first);
 assert.ok(receipt.eligibleForGame,'Recording must satisfy ordinary distance/time validation.');
 console.log(JSON.stringify({fixes:receipt.fixCount,continuousDistanceMetres:Math.round(receipt.distanceMetres),contacts:first.encounters.map(e=>({outbreak:e.name,result:e.reason,points:e.visitPoints})),confirmedVisitPoints:first.confirmedVisitPoints,restartRetry:'identical'},null,2));
}finally{await rm(dir,{recursive:true,force:true});}
