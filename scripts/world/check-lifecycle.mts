import {tampereWorldFixtures} from '../../apps/server/src/spatial/tampere.ts';
import {advanceSpatial} from '../../apps/server/src/spatial/lifecycle.ts';
import {cellKey} from '../../apps/server/src/spatial/access.ts';
import {createWorld} from '@sporeward/game';
import type {Persisted} from '../../apps/server/src/world-store.ts';
const days=Number(process.argv.find(a=>a.startsWith('--days='))?.slice(7)??14);
if(!Number.isSafeInteger(days)||days<1||days>90)throw new Error('Use 1–90 simulated days.');
const {fixtures,access}=await tampereWorldFixtures(73,20);
const s:Persisted={version:1,startedAt:Date.parse('2026-10-14T08:00:00Z'),fixtures,engine:createWorld({ids:fixtures.map(f=>f.id),seed:73,effort:4,balance:{splitProbability:0}}),activities:{},contributions:[],bonuses:{}};
let minimumLive=Infinity,maximumLive=0,replacements=0,remnants=0;
for(let hour=0;hour<days*24;hour++){
 advanceSpatial(s,60,access.cells);
 const visible=s.fixtures.filter(f=>f.retiredAt===undefined&&s.engine.targets.some(o=>o.id===f.id&&(o.cleared===null||s.engine.time<=o.cleared+s.engine.balance.cleanupProtectionMs/60000)));
 const owners=new Map<string,string>();
 for(const f of visible)for(const c of f.cells??[]){const key=cellKey(c),other=owners.get(key);if(other)throw new Error(`Visible outbreaks overlap at hour ${hour+1}: ${other} / ${f.id}`);owners.set(key,f.id);}
 minimumLive=Math.min(minimumLive,visible.length);maximumLive=Math.max(maximumLive,visible.length);
 if(visible.length<15)throw new Error('World exhausted its routing choices at hour '+(hour+1));
 if((hour+1)%24===0)console.log(JSON.stringify({day:(hour+1)/24,visible:visible.length,ordinary:s.engine.targets.filter(o=>!o.remnant&&o.cleared===null).length}));
}
replacements=s.engine.targets.filter(o=>!o.remnant&&o.id.startsWith('tampere-replacement-')).length;remnants=s.fixtures.filter(f=>f.id.includes(' · Remnant ')).length;
if(days>=6&&(!replacements||!remnants))throw new Error('Lifecycle failed to exercise remnants and replacements.');
console.log(JSON.stringify({days,minimumLive,maximumLive,replacements,remnants,preservedContributions:s.contributions.length}));
