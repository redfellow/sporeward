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
