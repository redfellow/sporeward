import {describe,it,expect} from 'vitest';
import {resizeOutbreak} from './resize.ts';
import {cellKey,cellRing} from './access.ts';
import type {SpatialOutbreak} from './generate.ts';
const cells=[{x:70000,y:38000},{x:70001,y:38000},{x:70002,y:38000},{x:70000,y:38001},{x:70000,y:38002}];
const outbreak:SpatialOutbreak={id:'branch',name:'Branch',accessWay:1,cells,ring:cellRing(cells)};
describe('geographic effort resize',()=>{
 it('withers the touched branch while keeping the other branch and a connected contour',()=>{
  const result=resizeOutbreak(outbreak,3,cells.map(c=>({...c,ways:[1]})),new Set(),new Map([[cellKey(cells[2]),10],[cellKey(cells[1]),9]]));
  expect(result.cells).toEqual([cells[0],cells[3],cells[4]]);expect(result.ring).not.toEqual(outbreak.ring);
 });
 it('grows around an occupied neighbour without claiming its cell',()=>{
  const blocked={x:70003,y:38000},around={x:70002,y:38001};
  const access=[...cells,blocked,around].map(c=>({...c,ways:[1]}));
  const result=resizeOutbreak(outbreak,6,access,new Set([cellKey(blocked)]));
  expect(result.cells).toContainEqual(around);expect(result.cells).not.toContainEqual(blocked);
  expect(resizeOutbreak(outbreak,6,access,new Set([cellKey(blocked)]))).toEqual(result);
 });
});
it('adds an edge cell gradually instead of jumping to its full footprint',()=>{
 const access=[];for(let x=69998;x<70007;x++)for(let y=37998;y<38006;y++)access.push({x,y,ways:[1]});
 const early=resizeOutbreak(outbreak,5.01,access,new Set()),middle=resizeOutbreak(early,5.5,access,new Set()),full=resizeOutbreak(middle,6,access,new Set());
 const area=(ring:[number,number][])=>{const origin=ring[0];return Math.abs(ring.reduce((a,p,i)=>{const q=ring[(i+1)%ring.length];return a+(p[0]-origin[0])*(q[1]-origin[1])-(q[0]-origin[0])*(p[1]-origin[1]);},0))/2;};
 expect(early.cells).toHaveLength(6);expect(early.partial?.fraction).toBe(0);expect(middle.partial?.key).toBe(early.partial?.key);
 expect(area(early.ring)).toBeLessThan(area(middle.ring));expect(area(middle.ring)).toBeLessThan(area(full.ring));
 expect(full.partial).toBeUndefined();expect(resizeOutbreak(outbreak,5.5,access,new Set())).toEqual(middle);
});
it('shrinks a selected leaf while retaining the unaffected branch cells',()=>{
 const access=cells.map(c=>({...c,ways:[1]})),heat=new Map([[cellKey(cells[2]),10]]);
 const partial=resizeOutbreak(outbreak,4.5,access,new Set(),heat);expect(partial.partial?.key).toBe(cellKey(cells[2]));expect(partial.cells).toEqual(cells);
 const smaller=resizeOutbreak(partial,4,access,new Set(),heat);expect(smaller.cells).toEqual(cells.filter(c=>cellKey(c)!==cellKey(cells[2])));
 expect(partial.cells).toContainEqual(cells[4]);expect(smaller.cells).toContainEqual(cells[4]);
});
