import {describe,it,expect} from 'vitest';
import clipping from 'polygon-clipping';
import {makeFootprint,contact,type Point} from './footprint';
import {project,unproject,cellCorners} from './geography';
import {makeRoute,routeContacts} from './route';
import map from './tampere-map.json';
const square=(a:number,b:number,c:number,d:number):Point[]=>[[a,b],[c,b],[c,d],[a,d],[a,b]];
describe('continuous geographic prototype',()=>{
 it('subtracts the actual Iidesjärvi polygon without water overlap',()=>{
  const water=map.water as Point[][][];
  const f=makeFootprint({center:[60,460],radius:230,seed:62},water);
  expect(f.rings.length).toBeGreaterThan(0);
  expect(clipping.intersection(f.polygons,water)).toEqual([]);
  for(const cell of f.cells)expect(clipping.intersection(f.polygons,[cellCorners(cell)]).length).toBeGreaterThan(0);
 });
 it('keeps an island as land while excluding the surrounding lake from contacts',()=>{
  const water=[[square(-90,-90,90,90),square(-12,-12,12,12)]];
  const f=makeFootprint({center:[0,0],radius:150,seed:71},water);
  expect(contact([0,0],f)).toBe(true);
  expect(contact([20,0],f)).toBe(false);
  expect(clipping.intersection(f.polygons,water)).toEqual([]);
 });
 it('clips neighbours and handles fully submerged growth without an invalid ring',()=>{
  const g={center:[0,0] as Point,radius:80,seed:71},a=makeFootprint(g,[]);
  const b=makeFootprint({...g,center:[35,0]},[],2,a.polygons);
  expect(clipping.intersection(a.polygons,b.polygons)).toEqual([]);
  expect(makeFootprint(g,[[square(-1000,-1000,1000,1000)]]).rings).toEqual([]);
 });
 it('replays 1 Hz geographic fixes and uses the shared footprint for every hit',()=>{
  const fixes=makeRoute(map.roads),f=makeFootprint({center:[60,460],radius:230,seed:62},map.water as Point[][][]),hits=routeContacts(fixes,[f]);
  expect(fixes.length).toBeGreaterThan(600);expect(hits.has(0)).toBe(true);
  const index=hits.get(0)!;expect(contact(project(fixes[index].coordinate),f)).toBe(true);
  expect(fixes.slice(0,index).some(fix=>contact(project(fix.coordinate),f))).toBe(false);
  for(let i=1;i<fixes.length;i++)expect(fixes[i].timestamp-fixes[i-1].timestamp).toBe(1000);
  const p:Point=[123.456,-98.765],restored=project(unproject(p));expect(restored[0]).toBeCloseTo(p[0],6);expect(restored[1]).toBeCloseTo(p[1],6);
 });
 it('is deterministic but varies between seeds independently of bookkeeping',()=>{
  const g={center:[0,0] as Point,radius:100,seed:1},a=makeFootprint(g,[]);
  expect(makeFootprint(g,[]).rings).toEqual(a.rings);
  expect(makeFootprint({...g,seed:2},[]).rings).not.toEqual(a.rings);
  const point=a.rings[0][0],before=contact([point[0]+3,point[1]+3],a);a.cells=[];
  expect(contact([point[0]+3,point[1]+3],a)).toBe(before);
 });
});
