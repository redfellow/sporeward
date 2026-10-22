import type {Coordinate} from '@sporeward/protocol';
import {tilePosition,tileCoordinate} from './access.ts';
import {landContour} from './water.ts';
import {separatedContour} from './separation.ts';
export const REMNANT_COLLECTION_RADIUS_MULTIPLIER=2;
/** Expand newly created remnant contact geometry, preserving normal land/separation rules. */
export function remnantCollectionContour(ring:Coordinate[],version:3|4|5,blockers:Coordinate[][]=[]):Coordinate[]|undefined{
 const points=ring.map(tilePosition),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
 const expanded=points.map(([x,y])=>tileCoordinate([cx+(x-cx)*REMNANT_COLLECTION_RADIUS_MULTIPLIER,cy+(y-cy)*REMNANT_COLLECTION_RADIUS_MULTIPLIER]));
 const land=version===5?landContour(expanded):expanded;
 return land?(version>=4?separatedContour(land,blockers):land):undefined;
}
