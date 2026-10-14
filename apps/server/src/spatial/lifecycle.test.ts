import {it,expect} from 'vitest';
import {createWorld} from '@sporeward/game';
import type {Persisted} from '../world-store.ts';
import {cellRing,cellKey} from './access.ts';
import {advanceSpatial} from './lifecycle.ts';
it('records actual growth and disintegration geometry while retaining the parent identity',()=>{
 const cells=[0,1,2,3,4].map(dx=>({x:70000+dx,y:38000}));
 const access=[];for(let x=69995;x<70012;x++)for(let y=37995;y<38006;y++)access.push({x,y,ways:[1]});
 const ring=cellRing(cells),state:Persisted={version:1,startedAt:1800000000000,fixtures:[{id:'parent',name:'Parent',cells,ring,accessWay:1}],engine:createWorld({ids:['parent'],balance:{maximumCells:6,growthDurationMs:360000,disintegrationDurationMs:60000,splitProbability:0}}),contributions:[],bonuses:{},activities:{},footprints:[{id:'parent',ring,validFrom:1800000000000,validUntil:null}]};
 advanceSpatial(state,2,access);expect(state.fixtures[0].cells).toHaveLength(6);expect(state.footprints!.filter(f=>f.id==='parent').length).toBeGreaterThan(1);
 advanceSpatial(state,5,access);const remnants=state.engine.targets.filter(o=>o.remnant);
 expect(remnants).toHaveLength(4);expect(remnants.reduce((n,o)=>n+o.bonus,0)).toBe(100);expect(state.engine.targets.some(o=>o.id==='parent')).toBe(true);
 expect(state.fixtures[0].retiredAt).toBe(state.startedAt+7*60000);
 const remnantCells=state.fixtures.filter(f=>remnants.some(o=>o.id===f.id)).map(f=>f.cells![0]);expect(new Set(remnantCells.map(cellKey)).size).toBe(4);
 for(const a of remnantCells)for(const b of remnantCells)if(a!==b)expect(Math.abs(a.x-b.x)+Math.abs(a.y-b.y)).toBeGreaterThan(1);
 expect(state.footprints!.filter(f=>f.id==='parent').at(-1)!.validUntil).toBe(state.startedAt+7*60000);
 advanceSpatial(state,53,access);const ordinary=state.engine.targets.filter(o=>!o.remnant&&o.cleared===null);expect(ordinary).toHaveLength(1);expect(ordinary[0].strength).toBe(4);
 const replacement=state.fixtures.find(f=>f.id===ordinary[0].id)!;expect(replacement.cells).toHaveLength(5);expect(replacement.spawnedAt).toBe(state.startedAt+60*60000);
});
