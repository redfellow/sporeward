import {NoLandContour} from './water.ts';
import {contour} from './contour.ts';
import {canonicalContour} from './continuous.ts';
import {separatedContour} from './separation.ts';
import {generateOutbreaks} from './generate.ts';
import {advanceWorld,createOutbreak,SPATIAL_BALANCE,type Footprint} from '@sporeward/game';
import type {Persisted} from '../world-store.ts';
import {cellKey,cellRing,neighbours,type AccessibleCell} from './access.ts';
import {resizeOutbreak} from './resize.ts';
import {captureFootprint} from './history.ts';
/** Advance every geographic transition alongside the deterministic rule tick. */
export function advanceSpatial(state:Persisted,minutes:number,access:AccessibleCell[]){
 if(!Number.isSafeInteger(minutes)||minutes<0)throw new Error('Invalid spatial clock advance.');
 const balance=state.spatialBalance??={...SPATIAL_BALANCE};
 const geometryVersion=state.contourVersion??3;
 if(!Number.isSafeInteger(balance.replacementInitialDelayMs)||balance.replacementInitialDelayMs<60000||!Number.isSafeInteger(balance.replacementIntervalMs)||balance.replacementIntervalMs<60000||!Number.isSafeInteger(balance.remnantRadiusCells)||balance.remnantRadiusCells<1)throw new Error('Invalid spatial balance.');
 let targetsById=new Map(state.engine.targets.map(o=>[o.id,o]));
 const occupies=(f:Persisted['fixtures'][number])=>{const o=targetsById.get(f.id);return f.retiredAt===undefined&&o&&(o.cleared===null||state.engine.time<=o.cleared+state.engine.balance.cleanupProtectionMs/60000);};
 state.footprints??=[];
 state.spatialRuntime??={density:state.engine.targets.filter(o=>!o.remnant&&o.cleared===null).length,sequence:0,nextSpawn:state.engine.time+balance.replacementInitialDelayMs/60000};
 for(let step=0;step<minutes;step++){
  const previous=[...state.engine.targets];advanceWorld(state.engine,1);
  targetsById=new Map(state.engine.targets.map(o=>[o.id,o]));const presentTargets=new Set(state.engine.targets);
  const timestamp=state.startedAt+state.engine.time*60000;
  // The planning engine replaces disintegrated parents; retain their identity
  // for historical contacts and previously attributed rewards.
  for(const parent of previous.filter(o=>!presentTargets.has(o))){
   const fixture=state.fixtures.find(f=>f.id===parent.id);if(!fixture?.cells)throw new Error('Missing disintegration geometry.');
   fixture.retiredAt=timestamp;parent.strength=0;parent.cleared=state.engine.time;parent.treatments=[];state.engine.targets.push(parent);targetsById.set(parent.id,parent);
   const children=state.engine.targets.filter(o=>o.id.startsWith(parent.id+' · Remnant '));
   const occupied=new Set(state.fixtures.filter(occupies).flatMap(f=>(f.cells??[]).map(cellKey)));
   const origin=fixture.cells[0],spots=access.filter(c=>!occupied.has(cellKey(c))&&!neighbours(c).some(n=>occupied.has(cellKey(n)))).sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y)||a.x-b.x||a.y-b.y);
   const selected:AccessibleCell[]=[];
   for(const c of spots){if(Math.hypot(c.x-origin.x,c.y-origin.y)>balance.remnantRadiusCells)break;if(selected.every(p=>Math.abs(p.x-c.x)+Math.abs(p.y-c.y)>1)){selected.push(c);if(selected.length===children.length)break;}}
   const placed:Persisted['fixtures']=[],blockers=state.fixtures.filter(occupies).map(f=>f.ring);
   if(selected.length===children.length)for(const [i,child] of children.entries()){
    const cells=[{x:selected[i].x,y:selected[i].y}],surface=geometryVersion>=4?canonicalContour(child.id):undefined;
    let proposed;try{proposed=contour(cells,undefined,child.id,geometryVersion,surface);}catch(e){if(e instanceof NoLandContour){placed.length=0;break;}throw e;}
    const ring=geometryVersion>=4?separatedContour(proposed,blockers):proposed;
    if(!ring){placed.length=0;break;}
    placed.push({id:child.id,name:fixture.name+' remnant '+(i+1),cells,surface,ring,accessWay:selected[i].ways[0],spawnedAt:timestamp});blockers.push(ring);
   }
   if(placed.length<children.length){
    const keep=children[0];keep.bonus=parent.bonus;state.engine.targets=state.engine.targets.filter(o=>!children.includes(o)||o===keep);
    state.fixtures.push({...fixture,id:keep.id,name:fixture.name+' remnant',spawnedAt:timestamp,retiredAt:undefined});
   }else state.fixtures.push(...placed);
   const last=state.footprints.filter(f=>f.id===parent.id).at(-1);if(last)last.validUntil=timestamp;
  }
  const runtime=state.spatialRuntime;
  if(state.engine.time>=runtime.nextSpawn){
   runtime.nextSpawn=state.engine.time+balance.replacementIntervalMs/60000;
   const ordinary=state.engine.targets.filter(o=>!o.remnant&&o.cleared===null).length;
   if(ordinary<runtime.density){
    const occupied=new Set(state.fixtures.filter(occupies).flatMap(f=>(f.cells??[]).map(cellKey)));
    const seed=(Math.imul(state.engine.rng,1664525)+1013904223)>>>0;state.engine.rng=seed;
    let spawn;try{spawn=generateOutbreaks(access,seed,1,occupied,geometryVersion,state.fixtures.filter(occupies).map(f=>f.ring))[0];}catch(e){if(!(e instanceof Error)||!e.message.startsWith('Accessible map supports only'))throw e;}
    if(spawn){
     spawn.id='tampere-replacement-'+seed+'-'+(++runtime.sequence);spawn.name='Tampere renewal '+runtime.sequence;
     const target=createOutbreak(spawn.id,state.engine.effort,state.engine.balance);target.deadline+=state.engine.time;
     state.engine.targets.push(target);targetsById.set(target.id,target);state.fixtures.push({...spawn,spawnedAt:timestamp});
     captureFootprint(state.footprints,{id:spawn.id,ring:spawn.ring,validFrom:timestamp,validUntil:null});
    }
   }
  }
  const occupiedCells=new Set(state.fixtures.filter(occupies).flatMap(f=>(f.cells??[]).map(cellKey)));
  for(const fixture of state.fixtures){
   const target=targetsById.get(fixture.id);if(!target||fixture.retiredAt!==undefined||target.cleared!==null&&state.engine.time>target.cleared+state.engine.balance.cleanupProtectionMs/60000)continue;
   let geometryUnchanged=true;
   if(target.cleared===null&&fixture.cells&&!target.remnant){
    const represented=fixture.cells.length-(fixture.partial?1-fixture.partial.fraction:0),quantized=Math.max(1/32,Math.round(target.cells*32)/32);
    if(Math.abs(represented-quantized)>1e-8){
    for(const c of fixture.cells)occupiedCells.delete(cellKey(c));
    const resized=resizeOutbreak({...fixture,cells:fixture.cells},quantized,access,occupiedCells,new Map(Object.entries(fixture.heat??{})),geometryVersion);
    if(target.cells>resized.cells.length){target.strength-=(target.cells-resized.cells.length)*target.unit;target.cells=resized.cells.length;}
    const ring=geometryVersion>=4?separatedContour(resized.ring,state.fixtures.filter(f=>f!==fixture&&occupies(f)).map(f=>f.ring)):resized.ring;
    geometryUnchanged=false;fixture.cells=resized.cells;fixture.partial=resized.partial;fixture.ring=ring??fixture.ring;fixture.surface=resized.surface;
    for(const c of fixture.cells)occupiedCells.add(cellKey(c));
    }
   }
   const footprint:Footprint={id:fixture.id,ring:fixture.ring,validFrom:timestamp,validUntil:target.cleared===null?null:state.startedAt+target.cleared*60000+state.engine.balance.cleanupProtectionMs};
   captureFootprint(state.footprints,footprint,geometryUnchanged);
  }
 }
}
