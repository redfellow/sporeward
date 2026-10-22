import {expect,it,vi} from 'vitest';
import * as rendering from '@sporeward/rendering';
import clipping from 'polygon-clipping';
import {canonicalContour} from './continuous';
import {contour} from './contour';
import {resizeOutbreak} from './resize';
import {separatedContour} from './separation';
it('reuses a persisted surface after restart without rebuilding its procedural field',()=>{
 const surface=canonicalContour('persisted-source')!,cells=[{x:70000,y:38000},{x:70001,y:38000},{x:70000,y:38001}],id='restored-identity';
 const fixture=JSON.parse(JSON.stringify({id,name:'Restored',cells,surface,accessWay:1,ring:contour(cells,undefined,id,4,surface)}));
 const build=vi.spyOn(rendering,'growthField').mockImplementation(()=>{throw new Error('Unexpected cold procedural rebuild.');});
 try{
  const resized=resizeOutbreak(fixture,2.5,cells.map(c=>({...c,ways:[1]})),new Set());
  expect(build).not.toHaveBeenCalled();expect(resized.surface).toEqual(surface);expect(resized.ring).not.toEqual(fixture.ring);expect(resized.ring.length).toBeLessThanOrEqual(500);
 }finally{build.mockRestore();}
});
it('clips against a neighbour without merging or claiming its interior',()=>{
 const ring:[number,number][]=[[0,0],[4,0],[4,4],[0,4]],neighbour:[number,number][]=[[3,1],[5,1],[5,3],[3,3]];
 const result=separatedContour(ring,[neighbour]);expect(result).toBeDefined();
 expect(clipping.intersection([result!],[neighbour])).toEqual([]);expect(result).not.toEqual(ring);expect(neighbour).toEqual([[3,1],[5,1],[5,3],[3,3]]);
});
it('rejects a hole rather than filling over another outbreak',()=>{
 expect(separatedContour([[0,0],[4,0],[4,4],[0,4]],[[[1,1],[2,1],[2,2],[1,2]]])).toBeUndefined();
});
