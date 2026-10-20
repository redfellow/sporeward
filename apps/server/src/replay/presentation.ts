/** Source-free UI fixture built from the same contours, view model and lifecycle engine. */
import {tampereWorldFixtures} from '../spatial/tampere.ts';
import {advanceSpatial} from '../spatial/lifecycle.ts';
import {contour} from '../spatial/contour.ts';
import {captureFootprint} from '../spatial/history.ts';
import {outbreakView} from '../outbreak-view.ts';
import {createWorld,applyVisit} from '@sporeward/game';
import type {Persisted} from '../world-store.ts';
export async function lifecyclePresentation(at:number){
 if(!Number.isSafeInteger(at)||at<=0)throw new Error('A valid presentation timestamp is required.');
 const now=Math.floor(at/60000)*60000,{fixtures,access}=await tampereWorldFixtures(73,20,'baseline',5);
 const s:Persisted={version:1,contourVersion:5,startedAt:now-10*60000,fixtures,engine:createWorld({ids:fixtures.map(f=>f.id),seed:73,effort:4,balance:{splitProbability:0}}),contributions:[],bonuses:{},activities:{},footprints:fixtures.map(f=>({id:f.id,ring:f.ring,validFrom:now-10*60000,validUntil:null}))};
 const targets=s.engine.targets;
  targets[0].strength=2;targets[0].unit=.4;targets[1].strength=6;targets[1].unit=1.2;
  for(let i=0;i<20;i++)applyVisit(s.engine,targets[2].id,'presentation-clear-'+i);
  applyVisit(s.engine,targets[3].id,'presentation-withering');
  for(let i=0;i<5;i++)applyVisit(s.engine,targets[4].id,'presentation-clearing-'+i);
  // Keep a second clearing example visible while the first demonstrates completion.
  for(let i=0;i<5;i++)applyVisit(s.engine,targets[8].id,'presentation-gradual-clearing-'+i);
  advanceSpatial(s,10,access.cells);
  // A late-stage example completes on the next ordinary minute tick. Existing
  // committed treatments do the work; production cleaning rules are unchanged.
  targets[4].strength=.001;
  const remnant=targets[5];remnant.remnant=true;remnant.cells=1;remnant.cap=1;remnant.strength=.25;remnant.unit=.25;remnant.bonus=25;remnant.expires=s.engine.time+72*60;
  const f=s.fixtures.find(f=>f.id===remnant.id)!;f.cells=f.cells!.slice(0,1);f.partial=undefined;f.ring=contour(f.cells,undefined,f.id,5,f.surface);
  captureFootprint(s.footprints!,{id:f.id,ring:f.ring,validFrom:now,validUntil:null});
  targets[6].deadline=s.engine.time+24*60;targets[7].stabilize=s.engine.time+30;
  const names=['Light effort','Heavy effort','Cleared · protected','Withering','Clearing','Remnant · bonus only','Disintegrating','Stabilizing','Clearing · gradual'];
  for(const [i,name] of names.entries())s.fixtures.find(f=>f.id===targets[i].id)!.name=name;

 const world={version:1 as const,serverTime:now,worldStartedAt:s.startedAt,outbreaks:s.fixtures.map(f=>outbreakView(s.engine,s.engine.targets.find(o=>o.id===f.id)!,f,'presentation-player',s.startedAt,now))};
 return {state:s,world};
}
