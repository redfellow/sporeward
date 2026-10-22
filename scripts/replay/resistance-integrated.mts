import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {parseReplayTrack,rebaseReplay,parseWorldView,parseEncounterRecap,parseFieldLabOffer} from '../../packages/protocol/src/index.ts';
import {matchContacts} from '../../packages/game/src/index.ts';
import {WorldStore,type Persisted} from '../../apps/server/src/world-store.ts';
import {ActivityStore} from '../../apps/server/src/activity-store.ts';
import {createApp} from '../../apps/server/src/app.ts';
import {tampereTestOutbreaks} from '../../apps/server/src/test-outbreaks.ts';
import {loadTampereAccess} from '../../apps/server/src/spatial/tampere.ts';
import {spawnFieldLabs} from '../../apps/server/src/field-labs.ts';

const track=parseReplayTrack(JSON.parse(await readFile(process.argv[2]??'work/replay/field-phone.json','utf8')));
const {cells}=await loadTampereAccess();
const baseline=1800000000000,day=86400000;
let seed=-1;
// Select a reproducible accessible lab on this private recorded route, without moving GPS fixes.
for(let candidate=0;candidate<400;candidate++){
 const labs=spawnFieldLabs(cells,candidate,0,track.started);
 if(matchContacts(track.fixes,labs.map(lab=>({id:lab.id,ring:lab.ring,validFrom:track.started,validUntil:null}))).length){seed=candidate;break;}
}
assert.ok(seed>=0,'No accessible lab fixture intersects this recording; use another normalized Tampere track.');
const root=await mkdtemp(join(tmpdir(),'sporeward-integrated-resistance-'));
let now=baseline;
const options={seed,labAccess:cells,contributionId:(contact:{player:string;activityId:string;outbreakId:string;contactAt:number})=>createHash('sha256').update(JSON.stringify(contact)).digest('hex')};
const worldRoot=join(root,'world');
const world=new WorldStore(worldRoot,()=>now,tampereTestOutbreaks,options);
const accounts={authenticate:async(token:string)=>['rider-a','rider-b'].includes(token)?{id:token,name:token,username:token}:null,register:async()=>{throw new Error('unused');},login:async()=>{throw new Error('unused');},logout:async()=>{}};
const app=await createApp({worldStore:world,accounts,rateLimitMax:10000,activityStoreFor:player=>new ActivityStore(join(root,'activities'),player,()=>now)});
const totals=new Map([['rider-a',0],['rider-b',0]]),weeks:{week:number;visitPoints:number;collections:number;restoration:number}[]=[];
try{
 await world.view('rider-a');
 // Long-lived high-effort contact fixtures isolate scoring from geographic replacement.
 const state:Persisted=JSON.parse(await readFile(join(worldRoot,'world.json'),'utf8'));
 for(const target of state.engine.targets){target.strength=100;target.unit=20;}
 await writeFile(join(worldRoot,'world.json'),JSON.stringify(state));
 await world.configureResistance(true);
 let coOpChecked=false,confirmedCollections=0;
 for(let week=0;week<4;week++){
  let visitPoints=0,collections=0,restoration=0;
  for(let weekday=0;weekday<5;weekday++)for(let visit=0;visit<2;visit++){
   const started=baseline+(week*7+weekday)*day+(8+visit*6)*3600000;
   if(week===0&&weekday===0&&visit===1){now=started;await world.prepareFieldLabs();}
   for(const player of ['rider-a','rider-b']){
    now=Math.max(now,started);
    const id=`w${week}-d${weekday}-v${visit}`,headers={'x-sporeward-session':player};
    const before=parseWorldView((await app.inject({url:'/world',headers})).json());
    if(before.fieldLabs){
     const quote=parseFieldLabOffer((await app.inject({method:'POST',url:`/outings/${id}/lab-offer`,headers,payload:{}})).json());
     assert.equal(quote.outingId,id);
     assert.deepEqual((await app.inject({method:'POST',url:`/outings/${id}/lab-offer`,headers,payload:{}})).json(),quote);
    }
    const payload=rebaseReplay(track,started,id);now=payload.activity.ended;
    for(let index=0;index<payload.chunkCount;index++){
     const response=await app.inject({method:'PUT',url:`/activities/${id}/chunks/${index}`,headers,payload:{...payload,fixes:payload.fixes.slice(index*1000,(index+1)*1000)}});
     assert.equal(response.statusCode,200);
    }
    const response=await app.inject({method:'POST',url:`/activities/${id}/complete`,headers,payload:{}});
    assert.equal(response.statusCode,200);
    const recap=parseEncounterRecap(response.json().encounters,id);
    assert.deepEqual((await app.inject({method:'POST',url:`/activities/${id}/complete`,headers,payload:{}})).json(),response.json());
    assert.deepEqual((await app.inject({url:`/activities/${id}/encounters`,headers})).json(),recap);
    totals.set(player,totals.get(player)!+recap.confirmedVisitPoints+recap.confirmedCleanupPoints);
    visitPoints+=recap.confirmedVisitPoints;
    const confirmed=(recap.labCollections??[]).filter(result=>result.status==='confirmed');
    collections+=confirmed.length;confirmedCollections+=confirmed.length;
    restoration+=confirmed.reduce((sum,result)=>sum+result.resistanceReduction,0);
    const after=parseWorldView((await app.inject({url:'/world',headers})).json());
    for(const result of confirmed){const lab=after.fieldLabs?.find(lab=>lab.id===result.labId);if(lab)assert.equal(lab.collected,true);}
    if(player==='rider-a'&&confirmed.length&&!coOpChecked){
     const other=parseWorldView((await app.inject({url:'/world',headers:{'x-sporeward-session':'rider-b'}})).json());
     for(const result of confirmed)assert.equal(other.fieldLabs!.find(lab=>lab.id===result.labId)!.collected,false);
     coOpChecked=true;
    }
   }
  }
  weeks.push({week:week+1,visitPoints,collections,restoration:+restoration.toFixed(6)});
 }
 assert.ok(coOpChecked&&confirmedCollections>=2,'Both players must collect independently through recorded contacts.');
 assert.ok(weeks.some(week=>week.restoration>0),'Recorded lab contact must remove positive resistance.');
 const standings=await world.standings();
 for(const [player,points] of totals)assert.equal(standings.find(entry=>entry.playerId===player)?.points,points);
 const final=await world.view('rider-a'),restarted=new WorldStore(worldRoot,()=>now,tampereTestOutbreaks,options);
 assert.deepEqual(await restarted.view('rider-a'),final);
 const summary={seed,recordedFixes:track.fixes.length,players:2,weeks,coOpIndependent:true,offersStable:true,retriesIdempotent:true,scoresMatchRecaps:true,restartPreserved:true,storage:'isolated temporary files',fixture:'high-effort persistent targets; original recorded GPS unchanged'};
 console.log(JSON.stringify(summary,null,2));
}finally{await app.close();await rm(root,{recursive:true,force:true});}
