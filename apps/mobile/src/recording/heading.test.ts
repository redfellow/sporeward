import {it,expect} from 'vitest';
import {travelHeading} from './heading';
const a={timestamp:1000,latitude:61.5,longitude:23.7,accuracy:5,segment:1};
it('uses continuous travel, suppresses drift and does not bridge a pause or GPS gap',()=>{
 expect(travelHeading([a,{...a,timestamp:2000,longitude:23.7006}])).toBeCloseTo(90,1);
 expect(travelHeading([a,{...a,timestamp:2000,longitude:23.70001}])).toBeNull();
 expect(travelHeading([a,{...a,timestamp:5000,longitude:23.7006}])).toBeNull();
 expect(travelHeading([a,{...a,timestamp:2000,longitude:23.7006,segment:2}])).toBeNull();
});
