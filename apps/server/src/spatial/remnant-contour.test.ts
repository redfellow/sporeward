import {it,expect} from 'vitest';
import {matchContacts} from '@sporeward/game';
import {tileCoordinate,tilePosition} from './access';
import {remnantCollectionContour} from './remnant-contour';
it('doubles remnant radius and accepts a ride beyond the former edge without changing the old ring',()=>{
 const ring=[[70000,38000],[70001,38000],[70001,38001],[70000,38001]].map(p=>tileCoordinate(p as [number,number])),old=structuredClone(ring);
 const enlarged=remnantCollectionContour(ring,4)!;
 const extent=(r:typeof ring)=>{const points=r.map(tilePosition);return [Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))-Math.min(...points.map(p=>p[1]))];};
 expect(extent(enlarged)[0]).toBeCloseTo(extent(ring)[0]*2,7);expect(extent(enlarged)[1]).toBeCloseTo(extent(ring)[1]*2,7);
 const contacts=(r:typeof ring,x:number)=>{const [longitude,latitude]=tileCoordinate([x,38000.5]);return matchContacts([{timestamp:1000,longitude,latitude,segment:1}],[{id:'remnant',ring:r,validFrom:0,validUntil:null}],0);};
 expect(contacts(ring,70001.25)).toHaveLength(0);expect(contacts(enlarged,70001.25)).toHaveLength(1);expect(contacts(enlarged,70001.75)).toHaveLength(0);
 expect(ring).toEqual(old);
});
it('retains separation from neighboring targets when enlarging a remnant',()=>{
 const ring=[[70000,38000],[70001,38000],[70001,38001],[70000,38001]].map(p=>tileCoordinate(p as [number,number]));
 const blocker=[[70001.1,37999],[70003,37999],[70003,38002],[70001.1,38002]].map(p=>tileCoordinate(p as [number,number]));
 const enlarged=remnantCollectionContour(ring,4,[blocker])!;
 expect(Math.max(...enlarged.map(p=>tilePosition(p)[0]))).toBeCloseTo(70001.1,7);
});
