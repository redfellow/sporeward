import {it,expect} from 'vitest';
import {guideCrackedRings,clipGuideRings,guideRoundedRing,guideClearingRing,guideSplittingPaths,sampleShape,remnantShapeRings,guideRemnantDroplets} from './outbreak-shapes';
it('preserves a separate rounded remnant core and fifteen finite satellite droplets',()=>{
 const rings=remnantShapeRings(71);expect(rings).toHaveLength(16);
 expect(guideRemnantDroplets()).toHaveLength(15);
 expect(rings.flat().every(p=>p.every(Number.isFinite))).toBe(true);
 const coreRadius=Math.max(...rings[0].map(([x,y])=>Math.hypot(x,y)));
 expect(coreRadius).toBeLessThan(80);
 expect(rings.slice(1).every(r=>r.some(([x,y])=>Math.hypot(x,y)>coreRadius))).toBe(true);
 expect(guideRoundedRing(69,71)).toEqual(guideRoundedRing(69,71));
});
it('uses distinct soft clearing and complementary splitting contours with an open zipper gap',()=>{
 expect(guideClearingRing(80,71)).not.toEqual(guideRoundedRing(80,71));
 const halves=guideSplittingPaths(71);expect(halves).toHaveLength(2);
 const seams=halves.map(path=>path.filter(c=>c.op==='line').slice(1).map(c=>c.op==='line'?c.point:[0,0]));
 expect(seams[0]).toHaveLength(25);expect(seams[1]).toHaveLength(25);
 for(let i=0;i<25;i++){expect(seams[1][24-i][1]).toBeCloseTo(seams[0][i][1],8);expect(seams[1][24-i][0]-seams[0][i][0]).toBeCloseTo(8,8);}
 expect(halves.flatMap(sampleShape).every(p=>p.every(Number.isFinite))).toBe(true);
});

it('clips state artwork to an authoritative concave land footprint without filling its cutout',()=>{
 const land:[number,number][]=[[0,0],[10,0],[10,3],[3,3],[3,10],[0,10]];
 const clipped=clipGuideRings([[[-2,-2],[12,-2],[12,12],[-2,12]]],[land]);
 expect(clipped).toHaveLength(1);
 const area=(ring:[number,number][])=>Math.abs(ring.reduce((sum,p,i)=>{const n=ring[(i+1)%ring.length];return sum+p[0]*n[1]-n[0]*p[1];},0)/2);
 expect(area(clipped[0])).toBeCloseTo(51);
 expect(clipped.flat().every(([x,y])=>x>=0&&x<=10&&y>=0&&y<=10&&(x<=3||y<=3))).toBe(true);
});

it('cuts an angular branched crack edge-to-edge and confines every result to its footprint',()=>{
 const box:[number,number][]=[[-50,-40],[50,-40],[50,40],[-50,40]];
 const pieces=guideCrackedRings([box]);
 expect(pieces).toHaveLength(2);
 const area=(ring:[number,number][])=>Math.abs(ring.reduce((sum,p,i)=>{const n=ring[(i+1)%ring.length];return sum+p[0]*n[1]-n[0]*p[1];},0)/2);
 expect(pieces.reduce((sum,r)=>sum+area(r),0)).toBeLessThan(8000);
 expect(pieces.flat().every(([x,y])=>x>=-50&&x<=50&&y>=-40&&y<=40)).toBe(true);
 // Both contours reach each outer edge: the fissure has no enclosed end cap.
 for(const x of [-50,50])for(const piece of pieces)expect(piece.some(p=>p[0]===x)).toBe(true);
 const contains=(point:[number,number],rings:[number,number][][])=>{
  let inside=false;for(const ring of rings)for(let i=0,j=ring.length-1;i<ring.length;j=i++){
   const a=ring[i],b=ring[j];if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }return inside;
 };
 // The trunk and both fork centres are open, while untouched material remains.
 for(const p of [[0,80*.073333333],[-16,80*.33],[15,-80*.22]] as [number,number][])expect(contains(p,pieces)).toBe(false);
 expect(contains([-40,-30],pieces)).toBe(true);
 const hole:[number,number][]=[[-45,-35],[-30,-35],[-30,-20],[-45,-20]];
 expect(contains([-40,-30],guideCrackedRings([box,hole]))).toBe(false);
 const concave:[number,number][]=[[-50,-40],[50,-40],[50,40],[10,40],[10,5],[-15,5],[-15,40],[-50,40]];
 const clipped=guideCrackedRings([concave]);
 expect(clipped.length).toBeGreaterThan(1);
 expect(clipped.flat().every(([x,y])=>x>=-50&&x<=50&&y>=-40&&y<=40&&(x<=-15||x>=10||y<=5))).toBe(true);
 expect(guideCrackedRings([box])).toEqual(pieces);
});
