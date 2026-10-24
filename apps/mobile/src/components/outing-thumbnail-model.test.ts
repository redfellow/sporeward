import {describe,it,expect} from 'vitest';
import {thumbnailRoute} from './outing-thumbnail-model';
import type {Fix} from '../recording/model';
const fixes=(count:number):Fix[]=>Array.from({length:count},(_,index)=>({timestamp:10000+index*1000,latitude:61.49,longitude:23.7+index*.00001,accuracy:5,segment:1}));
describe('outing thumbnail routes',()=>{
 it('keeps a long continuous outing visible after reducing its points',()=>{
  const input=fixes(7200),route=thumbnailRoute(input);
  expect(route.lines.features).toHaveLength(1);
  const coordinates=route.lines.features[0].geometry.coordinates;
  expect(coordinates.length).toBeLessThan(1501);
  expect(coordinates[0]).toEqual([input[0].longitude,input[0].latitude]);
  expect(coordinates.at(-1)).toEqual([input.at(-1)!.longitude,input.at(-1)!.latitude]);
 });
 it('preserves real GPS gaps and separate paused sections',()=>{
  const input=fixes(5000);input[2500].timestamp+=4000;for(let i=2501;i<input.length;i++)input[i].timestamp+=4000;for(let i=4000;i<input.length;i++)input[i].segment=2;
  const route=thumbnailRoute(input);
  expect(route.lines.features.map(feature=>feature.properties?.kind)).toEqual(['recorded','gap','recorded','recorded']);
 });
});
