import {expect,it} from 'vitest';
import clipping from 'polygon-clipping';
import {landContour,type WaterPolygon} from './water';
import type {Coordinate} from '@sporeward/protocol';
const square:Coordinate[]=[[0,0],[10,0],[10,10],[0,10]];
it('follows the shore without retaining disconnected fragments across the water',()=>{
 const water:WaterPolygon[]=[[[[3,-1],[5,-1],[5,11],[3,11]]]];
 const result=landContour(square,water)!;
 expect(result).toBeDefined();expect(clipping.intersection([result],...water)).toEqual([]);
 expect(Math.min(...result.map(p=>p[0]))).toBe(5);
});
it('retains actual islands while excluding surrounding water',()=>{
 const water:WaterPolygon[]=[[[[-1,-1],[11,-1],[11,11],[-1,11]],[[2,2],[2,8],[8,8],[8,2]]]];
 const result=landContour(square,water)!;
 expect(result).toBeDefined();expect(clipping.intersection([result],...water)).toEqual([]);expect(result.length).toBe(4);
});
it('rejects wholly aquatic and enclosed-hole footprints instead of painting water',()=>{
 expect(landContour(square,[[[[-1,-1],[11,-1],[11,11],[-1,11]]]])).toBeUndefined();
 expect(landContour(square,[[[[2,2],[4,2],[4,4],[2,4]]]])).toBeUndefined();
});
