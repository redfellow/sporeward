import {it,expect} from 'vitest';
import {createShowcaseClock,SHOWCASE_CLOCK_LIMIT_MINUTES} from './showcase-clock';

it('starts paused, advances explicitly, resumes by whole minutes and resets deterministically',()=>{
 let now=1000000;const clock=createShowcaseClock(()=>now);
 expect(clock.state()).toEqual({paused:true,elapsedMinutes:0,limitMinutes:SHOWCASE_CLOCK_LIMIT_MINUTES});
 now+=120000;expect(clock.state().elapsedMinutes).toBe(0);
 clock.advance(5);expect(clock.state().elapsedMinutes).toBe(5);
 clock.resume();now+=179000;expect(clock.state().elapsedMinutes).toBe(7);
 clock.pause();now+=180000;expect(clock.state().elapsedMinutes).toBe(7);
 expect(clock.reset()).toEqual({paused:true,elapsedMinutes:0,limitMinutes:SHOWCASE_CLOCK_LIMIT_MINUTES});
});

it('rejects invalid or out-of-range advances and pauses at the deterministic limit',()=>{
 let now=0;const clock=createShowcaseClock(()=>now);
 expect(()=>clock.advance(0)).toThrow();expect(()=>clock.advance(1.5)).toThrow();
 clock.advance(SHOWCASE_CLOCK_LIMIT_MINUTES);expect(clock.state().paused).toBe(true);
 expect(()=>clock.advance(1)).toThrow();expect(()=>clock.resume()).toThrow();
});
