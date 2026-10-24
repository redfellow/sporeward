import {describe,it,expect} from 'vitest';
import {guideSpecimenSvg} from './guide-specimen';
import {growthContours} from './growth-contours';
import {guideScheme,type GuideState} from './outbreak-guide';
const states:GuideState[]=['easy','medium','hard','disintegrating','remnant','withering','clearing','cracking','stabilizing','cooldown','visited'];
describe('bundled field guide specimens',()=>{
 it('produces finite, deterministic, self-contained illustrations for every state and theme',()=>{
  for(const state of states)for(const bright of [false,true]){
   const svg=guideSpecimenSvg(state,bright);
   expect(svg).toBe(guideSpecimenSvg(state,bright));
   expect(svg).not.toMatch(/NaN|Infinity|<image|<script|href=/);
   expect(svg).toContain('clip-path="url(#body)"');
  }
 });
 it('retains the violet remnant, contact signal, crack gap and moving membranes',()=>{
  expect(guideSpecimenSvg('remnant')).toContain(guideScheme.remnant.body);
  expect(guideSpecimenSvg('visited')).toContain(guideScheme.signal);
  expect(guideSpecimenSvg('cracking')).not.toBe(guideSpecimenSvg('medium'));
  expect(guideSpecimenSvg('stabilizing')).not.toBe(guideSpecimenSvg('clearing'));
  expect(guideSpecimenSvg('withering',false,1)).not.toBe(guideSpecimenSvg('withering',false,0));
 });
 it('uses closed continuous-field contours with finite coordinates',()=>{
  const rings=growthContours({center:[0,0],radius:77,seed:71},4);
  expect(rings.length).toBeGreaterThan(0);
  expect(rings.every(ring=>ring.length>3&&ring.every(point=>point.every(Number.isFinite)))).toBe(true);
 });
});
