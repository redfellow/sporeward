import {generateOutbreaks} from './generate.ts';
import {advanceWorld,createOutbreak,SPATIAL_BALANCE,type Footprint} from '@sporeward/game';
import type {Persisted} from '../world-store.ts';
import {cellKey,cellRing,type AccessibleCell} from './access.ts';
import {resizeOutbreak} from './resize.ts';
import {captureFootprint} from './history.ts';
/** Advance every geographic transition alongside the deterministic rule tick. */
export function advanceSpatial(state:Persisted,minutes:number,access:AccessibleCell[]){
 if(!Number.isSafeInteger(minutes)||minutes<0)throw new Error('Invalid spatial clock advance.');
 const balance=state.spatialBalance??={...SPATIAL_BALANCE};
 if(!Number.isSafeInteger(balance.replacementInitialDelayMs)||balance.replacementInitialDelayMs<60000||!Number.isSafeInteger(balance.replacementIntervalMs)||balance.replacementIntervalMs<60000||!Number.isSafeInteger(balance.remnantRadiusCells)||balance.remnantRadiusCells<1)throw new Error('Invalid spatial balance.');
 state.footprints??=[];
 state.spatialRuntime??={density:state.engine.targets.filter(o=>!o.remnant&&o.cleared===null).length,sequence:0,nextSpawn:state.engine.time+balance.replacementInitialDelayMs/60000};
 for(let step=0;step<minutes;step++){
  const previous=[...state.engine.targets];advanceWorld(state.engine,1);
  const timestamp=state.startedAt+state.engine.time*60000;
  // The planning engine replaces disintegrated parents; retain their identity
  // for historical contacts and previously attributed rewards.
  for(const parent of previous.filter(o=>!state.engine.targets.includes(o))){
   const fixture=state.fixtures.find(f=>f.id===parent.id);if(!fixture?.cells)throw new Error('Missing disintegration geometry.');
   fixture.retiredAt=timestamp;parent.strength=0;parent.cleared=state.engine.time;parent.treatments=[];state.engine.targets.push(parent);
   const children=state.engine.targets.filter(o=>o.id.startsWith(parent.id+' · Remnant '));
   const occupied=new Set(state.fixtures.filter(f=>f.retiredAt===undefined&&state.engine.targets.find(o=>o.id===f.id)?.cleared===null).flatMap(f=>(f.cells??[]).map(cellKey)));
   const origin=fixture.cells[0],spots=access.filter(c=>!occupied.has(cellKey(c))).sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y)||a.x-b.x||a.y-b.y);
   const selected:AccessibleCell[]=[];
   for(const c of spots){if(Math.hypot(c.x-origin.x,c.y-origin.y)>balance.remnantRadiusCells)break;if(selected.every(p=>Math.abs(p.x-c.x)+Math.abs(p.y-c.y)>1)){selected.push(c);if(selected.length===children.length)break;}}
   if(selected.length<children.length){
    const keep=children[0];keep.bonus=parent.bonus;state.engine.targets=state.engine.targets.filter(o=>!children.includes(o)||o===keep);
    state.fixtures.push({...fixture,id:keep.id,name:fixture.name+' remnant',spawnedAt:timestamp,retiredAt:undefined});
   }else for(const [i,child] of children.entries()){
    const cells=[{x:selected[i].x,y:selected[i].y}];state.fixtures.push({id:child.id,name:fixture.name+' remnant '+(i+1),cells,ring:cellRing(cells),accessWay:selected[i].ways[0],spawnedAt:timestamp});
   }
   const last=state.footprints.filter(f=>f.id===parent.id).at(-1);if(last)last.validUntil=timestamp;
  }
  const runtime=state.spatialRuntime;
  if(state.engine.time>=runtime.nextSpawn){
   runtime.nextSpawn=state.engine.time+balance.replacementIntervalMs/60000;
   const ordinary=state.engine.targets.filter(o=>!o.remnant&&o.cleared===null).length;
   if(ordinary<runtime.density){
    const occupied=new Set(state.fixtures.filter(f=>f.retiredAt===undefined&&state.engine.targets.find(o=>o.id===f.id)?.cleared===null).flatMap(f=>(f.cells??[]).map(cellKey)));
    const seed=(Math.imul(state.engine.rng,1664525)+1013904223)>>>0;state.engine.rng=seed;
    let spawn;try{spawn=generateOutbreaks(access,seed,1,occupied)[0];}catch(e){if(!(e instanceof Error)||!e.message.startsWith('Accessible map supports only'))throw e;}
    if(spawn){
     spawn.id='tampere-replacement-'+seed+'-'+(++runtime.sequence);spawn.name='Tampere renewal '+runtime.sequence;
     const target=createOutbreak(spawn.id,state.engine.effort,state.engine.balance);target.deadline+=state.engine.time;
     state.engine.targets.push(target);state.fixtures.push({...spawn,spawnedAt:timestamp});
     captureFootprint(state.footprints,{id:spawn.id,ring:spawn.ring,validFrom:timestamp,validUntil:null});
    }
   }
  }
  for(const fixture of state.fixtures){
   const target=state.engine.targets.find(o=>o.id===fixture.id);if(!target||fixture.retiredAt!==undefined)continue;
   if(target.cleared===null&&fixture.cells&&!target.remnant){
    const occupied=new Set(state.fixtures.filter(f=>f.id!==fixture.id&&f.retiredAt===undefined&&state.engine.targets.find(o=>o.id===f.id)?.cleared===null).flatMap(f=>(f.cells??[]).map(cellKey)));
    const resized=resizeOutbreak({...fixture,cells:fixture.cells},target.cells,access,occupied,new Map(Object.entries(fixture.heat??{})));
    if(target.cells>resized.cells.length){target.strength-=(target.cells-resized.cells.length)*target.unit;target.cells=resized.cells.length;}
    fixture.cells=resized.cells;fixture.ring=resized.ring;
   }
   const footprint:Footprint={id:fixture.id,ring:fixture.ring,validFrom:timestamp,validUntil:target.cleared===null?null:state.startedAt+target.cleared*60000+state.engine.balance.cleanupProtectionMs};
   captureFootprint(state.footprints,footprint);
  }
 }
}
