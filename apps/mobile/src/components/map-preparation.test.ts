import {it,expect} from 'vitest';
import type {OutbreakView,WorldView,Coordinate} from '@sporeward/protocol';
import {overviewBounds,outbreakPreparationIndex,selectPreparedOutbreaks} from './map-preparation';
const target=(id:string,x:number,y=4):OutbreakView=>({id,name:id,ring:[[x,y],[x+1,y],[x+1,y+1],[x,y+1]],spawnedAt:0,clearedAt:null,status:'active',strength:2,committedCleaning:0,visitsRemaining:2,visitPoints:10,cleanupBonus:50,eligibleAt:0});
const viewport={center:[5,5] as [number,number],bounds:[0,0,10,10] as [number,number,number,number],zoom:14};
it('prepares an approaching neighbor before it enters the viewport and excludes distant bodies',()=>{
 const index=outbreakPreparationIndex([target('visible',4),target('approaching',13),target('far',17)]);
 const prepared=selectPreparedOutbreaks(index,viewport);
 expect(prepared.map(v=>[v.outbreak.id,v.visible])).toEqual([['visible',true],['approaching',false]]);
 const panned={...viewport,center:[15,5] as [number,number],bounds:[10,0,20,10] as [number,number,number,number]};
 expect(selectPreparedOutbreaks(index,panned).find(v=>v.outbreak.id==='approaching')!.visible).toBe(true);
});
it('prioritizes visible work, orders ties deterministically and bounds the preparation set',()=>{
 const targets=[target('z',4),target('a',4),target('neighbor',10.1)];
 const ids=(input:OutbreakView[])=>selectPreparedOutbreaks(outbreakPreparationIndex(input),viewport,2).map(v=>v.outbreak.id);
 expect(ids(targets)).toEqual(['a','z']);expect(ids([...targets].reverse())).toEqual(['a','z']);
 const many=outbreakPreparationIndex(Array.from({length:100},(_,i)=>target(String(i),4)));
 expect(selectPreparedOutbreaks(many,viewport)).toHaveLength(24);
});
it('computes overview bounds without spreading an entire world into function arguments',()=>{
 const base=Array.from({length:220},(_,i):Coordinate=>[i/100,(i%110)/100]);
 const outbreaks=Array.from({length:1000},(_,i)=>({...target(String(i),i),ring:base.map(([x,y])=>[x+i,y] as Coordinate)}));
 const world={version:1,serverTime:1,worldStartedAt:1,outbreaks} satisfies WorldView;
 expect(overviewBounds(world,null)).toEqual([0,0,1001.19,1.09]);
 expect(overviewBounds(null,[1,2,3,4])).toEqual([1,2,3,4]);
});
