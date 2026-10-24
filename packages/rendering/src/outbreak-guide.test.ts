import {it,expect} from 'vitest';
import {guideBaseState,guideOverviewScale,guideState,guidePigment,guideScheme,guideBadgeSvg,guideContactSvg} from './outbreak-guide';
it('retains stabilisation and clearing while distinguishing personal unavailability and effort',()=>{
 const o={status:'active',lifecycle:'ordinary',eligibleAt:0,visitsRemaining:2};
 expect(guideState(o,100)).toBe('easy');
 expect(guideState({...o,visitsRemaining:3},100)).toBe('medium');
 expect(guideState({...o,visitsRemaining:6},100)).toBe('hard');
 expect(guideState({...o,status:'clearing'},100)).toBe('clearing');
 expect(guideState({...o,eligibleAt:101},100)).toBe('cooldown');
 expect(guideState({...o,lifecycle:'stabilizing',eligibleAt:101},100)).toBe('stabilizing');
 expect(guideState({...o,eligibleAt:101},100,true)).toBe('visited');
 expect(guidePigment('remnant')).toEqual(guideScheme.remnant);
 expect(guideBadgeSvg('disintegrating',false)).toContain('M26 15L18 25');
 expect(guideContactSvg('medium',false)).toContain('M17 24L22 29L31 19');
 expect(guideContactSvg('medium',false)).toContain('M21 17V31M27 17V31');
 expect(guideContactSvg('medium',false)).toContain('translate(4 -4) scale(.83)');
});

it('keeps contact separate from effort, cooldown, and lifecycle appearance',()=>{
 const o={status:'active',lifecycle:'ordinary',eligibleAt:0,visitsRemaining:7};
 expect(guideBaseState(o,100)).toBe('hard');
 expect(guideBaseState({...o,lifecycle:'disintegrating'},100)).toBe('disintegrating');
 expect(guideBaseState({...o,status:'withering'},100)).toBe('withering');
 expect(guideBaseState({...o,status:'clearing'},100)).toBe('clearing');
 expect(guideBaseState({...o,lifecycle:'remnant'},100)).toBe('remnant');
 expect(guideBaseState({...o,eligibleAt:101},100)).toBe('cooldown');
 expect(guideState({...o,lifecycle:'disintegrating'},100,true)).toBe('visited');
 expect(guideBaseState({...o,lifecycle:'disintegrating'},100)).toBe('disintegrating');
 expect(guidePigment(guideBaseState({...o,eligibleAt:101},100))).toEqual(guidePigment('cooldown'));
});

it('keeps heavy overview bodies full-size, medium ten percent smaller and light/remnant fifteen percent smaller',()=>{
 expect(guideOverviewScale('hard')).toBe(1);
 expect(guideOverviewScale('medium')).toBe(.9);
 for(const state of ['easy','remnant'] as const)expect(guideOverviewScale(state)).toBe(.85);
 expect(guideOverviewScale('disintegrating')).toBe(1);
 expect(guideOverviewScale('cracking')).toBe(.9);
});
