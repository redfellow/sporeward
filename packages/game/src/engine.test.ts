import { describe, expect, it } from 'vitest';
import { advanceWorld, applyVisit, createWorld, nextVisit, pendingCleaning } from './engine';
const target=(s:ReturnType<typeof createWorld>,id='West')=>s.targets.find(o=>o.id===id)!;
describe('extracted cleaning scenarios',()=> {
 it('solo route: independent cooldowns, half points and gentler repeat cleaning',()=> {
  const s=createWorld();applyVisit(s,'West','A');advanceWorld(s,30);applyVisit(s,'Central','A');advanceWorld(s,30);applyVisit(s,'East','A');
  expect(s.scores.A).toBe(300);expect(applyVisit(s,'West','A').reason).toBe('cooldown');expect(target(s).visits).toHaveLength(1);
  advanceWorld(s,299);expect(applyVisit(s,'West','A').accepted).toBe(false);
  advanceWorld(s,1);expect(applyVisit(s,'West','A')).toMatchObject({accepted:true,points:50,power:0.75});expect(s.scores.A).toBe(350);
  const t=target(s).treatments.at(-1)!;expect(t.fast+t.slow).toBeCloseTo(0.75);expect(nextVisit(s,target(s,'East'),'A').wait).toBe(60);
 });
 it('group route: deferred decay, shared bonuses, exactly-once grace awards',()=> {
  const s=createWorld();for(const id of ['West','Central']) for(const p of ['A','B','C','D']) applyVisit(s,id,p);
  expect(target(s).strength).toBe(4);expect(pendingCleaning(target(s))).toBe(4);expect(target(s).cleared).toBeNull();
  advanceWorld(s,5);expect(target(s).strength).toBeCloseTo(4-1-3*5/720);expect(target(s).cells).toBeLessThan(5);
  advanceWorld(s,715);expect(target(s).cleared).toBe(720);expect(target(s,'Central').cleared).toBe(720);
  for(const p of ['A','B','C','D']) expect(s.scores[p]).toBe(400);
  expect(target(s,'East').strength).toBeGreaterThan(4);expect(target(s,'East').cleared).toBeNull();
  applyVisit(s,'West','E');applyVisit(s,'West','E');expect(s.scores.E).toBe(200);
  advanceWorld(s,10);expect(applyVisit(s,'West','F').accepted).toBe(true);
  advanceWorld(s,1);expect(applyVisit(s,'West','G').reason).toBe('expired');expect(s.scores.G).toBeUndefined();
 });
 it('seeded split: conserve treatments/bonus, pause treatments and inherit cooldowns',()=> {
  const s=createWorld({effort:6,seed:2000});for(const p of ['A','B','C','D']) {applyVisit(s,'West',p,{corridorCrossing:true});applyVisit(s,'East',p);}
  const a=target(s,'West · Left'),b=target(s,'West · Right');expect(a).toBeDefined();expect(b).toBeDefined();
  expect(a.bonus+b.bonus).toBe(100);expect(a.strength+b.strength).toBeCloseTo(5.4);expect(pendingCleaning(a)+pendingCleaning(b)).toBeCloseTo(4);
  expect(a.extensionCap+b.extensionCap).toBe(1440-480);
  advanceWorld(s,10);expect(applyVisit(s,a.id,'E').reason).toBe('stabilizing');expect(pendingCleaning(a)).toBeCloseTo(2);
  advanceWorld(s,20);expect(applyVisit(s,a.id,'A').reason).toBe('cooldown');expect(s.scores.A).toBe(200);
  expect(applyVisit(s,a.id,'E').points).toBe(100);advanceWorld(s,330);expect(applyVisit(s,a.id,'A').points).toBe(50);expect(s.scores.A).toBe(250);
 });
});
describe('rule boundaries and replay',()=> {
 it('is repeatable, serializable and independent of advance chunk sizes',()=> {
  const run=()=>{const s=createWorld({seed:2000,effort:6});for(const p of ['A','B','C','D']) applyVisit(s,'West',p,{corridorCrossing:true});return s;};
  const a=run(),b=JSON.parse(JSON.stringify(run()));advanceWorld(a,800);for(let i=0;i<80;i++) advanceWorld(b,10);expect(a).toEqual(b);
  expect(()=>advanceWorld(a,-1)).toThrow();expect(()=>advanceWorld(a,0.5)).toThrow();expect(()=>createWorld({balance:{splitProbability:2}})).toThrow();
 });
 it('does not grow while cleaning and resumes after treatment ends',()=> {
  const s=createWorld({effort:6});applyVisit(s,'West','A');advanceWorld(s,720);const o=target(s),size=o.cells,strength=o.strength;
  expect(pendingCleaning(o)).toBe(0);expect(strength).toBeCloseTo(5);expect(size).toBeLessThan(5);
  advanceWorld(s,1);expect(o.cells).toBeGreaterThan(size);expect(o.strength).toBeGreaterThan(strength);
 });
 it('gives full points to an eligible protection-window return, despite prior history',()=> {
  const s=createWorld();applyVisit(s,'West','A');advanceWorld(s,360);
  for(let i=0;i<20;i++) applyVisit(s,'West',`rider-${i}`);
  advanceWorld(s,5);expect(target(s).cleared).not.toBeNull();expect(applyVisit(s,'West','A').points).toBe(100);expect(s.scores.A).toBe(300);
 });
 it('awards the last visitor and the ten-minute group relative to the visit, not destruction',()=> {
  const s=createWorld({effort:2});applyVisit(s,'West','A');advanceWorld(s,11);applyVisit(s,'West','B');advanceWorld(s,720);
  expect(target(s).cleared).not.toBeNull();expect(s.scores.A).toBe(100);expect(s.scores.B).toBe(200);
 });
 it('caps lifetime extensions and divides locked bonus among non-growing remnants',()=> {
  const s=createWorld({ids:['West']});for(let i=0;i<20;i++) applyVisit(s,'West',`p${i}`);expect(target(s).extension).toBe(1440);
  const empty=createWorld({ids:['West']});advanceWorld(empty,7200);expect(empty.targets).toHaveLength(4);expect(empty.targets.reduce((v,o)=>v+o.bonus,0)).toBe(100);
  const r=empty.targets[0];advanceWorld(empty,10);expect(r.cells).toBe(1);expect(applyVisit(empty,r.id,'A').points).toBe(0);expect(empty.scores.A).toBe(25);
  advanceWorld(empty,4320);expect(applyVisit(empty,empty.targets[1].id,'B').reason).toBe('expired');expect(empty.scores.B).toBeUndefined();
 });
 it('recovers points slowly after 72 hours, with cleaning recovery left unchanged',()=> {
  const s=createWorld({ids:['West']});applyVisit(s,'West','A');const o=target(s);
  s.time=4320;expect(nextVisit(s,o,'A').points).toBe(50);
  s.time=4320+10080;expect(nextVisit(s,o,'A').points).toBe(75);
  s.time=4320+20160;expect(nextVisit(s,o,'A')).toMatchObject({points:100,power:0.75,wait:0});
 });
});
