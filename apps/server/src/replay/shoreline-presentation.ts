/** Geometry-only field reproduction. Never copy player histories or rewards. */
import {createWorld} from '@sporeward/game';
import {WorldStore,type Persisted} from '../world-store.ts';
import {loadTampereAccess} from '../spatial/tampere.ts';
import {outbreakView} from '../outbreak-view.ts';
import {parseWorldView} from '@sporeward/protocol';
export async function shorelinePresentation(source:Persisted,at:number){
 if(source.version!==1||!Array.isArray(source.fixtures)||!Array.isArray(source.engine?.targets))throw new Error('Invalid source snapshot.');
 const targets=new Map(source.engine.targets.map(t=>[t.id,t]));
 const fixtures=source.fixtures.filter(f=>f.retiredAt===undefined&&targets.get(f.id)?.cleared===null).map(f=>({id:f.id,name:f.name,ring:structuredClone(f.ring),cells:structuredClone(f.cells),partial:structuredClone(f.partial),surface:structuredClone(f.surface),accessWay:f.accessWay,spawnedAt:at}));
 if(fixtures.length>10000||fixtures.some(f=>!f.cells||f.ring.length<3||f.ring.length>500))throw new Error('Invalid field geometry.');
 const engine=createWorld({ids:fixtures.map(f=>f.id),seed:73,effort:4,balance:{splitProbability:0}});
 for(const t of engine.targets){const original=targets.get(t.id)!;for(const k of ['cells','cap','unit','strength','bonus','remnant'] as const)Object.assign(t,{[k]:original[k]});t.deadline=7*24*60;t.expires=t.remnant?72*60:null;}
 const state:Persisted={version:1,contourVersion:source.contourVersion,startedAt:at,fixtures,engine,contributions:[],bonuses:{},activities:{},spatialRuntime:{density:600,sequence:0,nextSpawn:60}};
 const access=await loadTampereAccess('urban');
 const world=new WorldStore('/unused',()=>at,()=>[],{spatial:access.cells,persistence:{transaction:async(_initial,operation)=>operation(state)}});
 await world.prepareOrganicContours();await world.prepareShorelines();
 const view=parseWorldView({version:1,serverTime:at,worldStartedAt:at,outbreaks:state.fixtures.map(f=>outbreakView(engine,engine.targets.find(t=>t.id===f.id)!,f,'shoreline-review',at,at))});
 return {state,world:view};
}
