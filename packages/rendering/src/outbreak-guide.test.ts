import {it,expect} from 'vitest';
import {guideOverviewScale,guideState,guidePigment,guideScheme,guideBadgeSvg} from './outbreak-guide';
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
});

it('keeps heavy overview bodies full-size, medium ten percent smaller and light/remnant fifteen percent smaller',()=>{
 expect(guideOverviewScale('hard')).toBe(1);
 expect(guideOverviewScale('medium')).toBe(.9);
 for(const state of ['easy','remnant'] as const)expect(guideOverviewScale(state)).toBe(.85);
 expect(guideOverviewScale('disintegrating')).toBe(1);
 expect(guideOverviewScale('cracking')).toBe(.9);
});
