import {expect,it} from 'vitest';
import {surveyStationSvg} from './station-svg';
import {resistanceContour,resistanceHazeStops} from './resistance-artwork';

it('preserves transparent station glow stops and distinct available/collected poses',()=>{
 const available=surveyStationSvg(false),collected=surveyStationSvg(true);
 expect(available).toContain('stop-opacity="0"');
 expect(available).not.toContain('stop-color-opacity');
 expect(available).toContain('radialGradient');
 expect(collected).not.toContain('radialGradient');
 expect(collected).not.toBe(available);
 expect(surveyStationSvg(true,0)).toBe(surveyStationSvg(true,5));
});
it('keeps the resistance falloff transparent at its boundary and contours bounded',()=>{
 expect(resistanceHazeStops.at(-1)).toEqual([1,0]);
 for(let band=0;band<6;band++)for(const [x,y] of resistanceContour(5000,band))expect(Math.hypot(x,y)).toBeLessThan(5100);
});
