import type {Footprint} from '@sporeward/game';
/** Store each actual shape transition as a half-open interval. No sampling of
 * today's contour can substitute for the contour at an earlier GPS timestamp.
 */
export function captureFootprint(history:Footprint[],next:Footprint){
 const versions=history.filter(v=>v.id===next.id),latest=versions[versions.length-1];
 const same=latest&&JSON.stringify(latest.ring)===JSON.stringify(next.ring);
 if(same){latest.validUntil=next.validUntil;return;}
 if(latest&&next.validFrom<latest.validFrom)throw new Error('Footprint history cannot move backwards.');
 const copy:Footprint={...next,ring:next.ring.map(p=>[p[0],p[1]])};
 if(latest&&latest.validFrom===next.validFrom){Object.assign(latest,copy);return;}
 if(latest&&latest.validUntil===null)latest.validUntil=next.validFrom;
 history.push(copy);
}
