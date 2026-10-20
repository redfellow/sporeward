import {it,expect} from 'vitest';
import {parseWorldView} from '@sporeward/protocol';
import {lifecyclePresentation} from './presentation';
it('provides repeatable, valid lifecycle examples without user tracks or contributions',async()=>{
 const a=await lifecyclePresentation(1800000000000),b=await lifecyclePresentation(1800000000000);
 expect(a).toEqual(b);expect(parseWorldView(a.world).outbreaks).toHaveLength(20);
 expect(new Set(a.world.outbreaks.map(o=>o.status))).toEqual(new Set(['active','withering','clearing','cleared']));
 expect(new Set(a.world.outbreaks.map(o=>o.lifecycle))).toEqual(new Set(['ordinary','remnant','disintegrating','stabilizing']));
 expect(a.world.outbreaks.find(o=>o.name==='Remnant · bonus only')).toMatchObject({visitPoints:0,cleanupBonus:25,visitsRemaining:1});
 expect(a.world.outbreaks.find(o=>o.name==='Clearing')).toMatchObject({status:'clearing',visitsRemaining:0});
 expect(a.state.contributions).toEqual([]);expect(a.state.activities).toEqual({});
});
