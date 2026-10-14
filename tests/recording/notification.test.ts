import {describe,it,expect} from 'vitest';
import {notificationAction} from '../../apps/mobile/src/recording/notification-action';
import {deliveryDiagnostic} from '../../apps/mobile/src/recording/delivery';
describe('notification routing',()=> {
 it('accepts activity-scoped controls and ignores ordinary opens and malformed links',()=> {
  expect(notificationAction('sporeward://recorder/pause?activity=outing&nonce=42')).toEqual({action:'pause',activity:'outing',nonce:'42'});
  for(const u of [null,'bad','https://recorder/pause?activity=x&nonce=1','sporeward://recorder/open?activity=x&nonce=1','sporeward://recorder/finish','sporeward://other/resume?activity=x&nonce=1']) expect(notificationAction(u)).toBeNull();
 });
});
describe('delivery timing',()=> {
 it('distinguishes delayed delivery from sparse source sampling, without coordinates',()=> {
  expect(deliveryDiagnostic([1000,2000,8000],10000)).toEqual({receivedAt:10000,count:3,firstFixAt:1000,lastFixAt:8000,oldestLagMs:9000,newestLagMs:2000,withinBatchGapsOver2s:1,maxWithinBatchGapMs:6000});
  expect(deliveryDiagnostic([],10000).newestLagMs).toBeNull();
  expect(deliveryDiagnostic([2000,1000,NaN],3000).maxWithinBatchGapMs).toBe(1000);
 });
});
