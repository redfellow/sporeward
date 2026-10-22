/** Frozen UI review data. No GPS history, account state or earned rewards. */
import {advanceWorld,createWorld,applyVisit} from '@sporeward/game';
import {parseWorldView,type WorldView} from '@sporeward/protocol';
import {loadTampereAccess} from '../spatial/tampere.ts';
import {generateOutbreaks} from '../spatial/generate.ts';
import {tileCoordinate} from '../spatial/access.ts';
import {outbreakView} from '../outbreak-view.ts';
import {spawnFieldLabs} from '../field-labs.ts';
import {remnantCollectionContour} from '../spatial/remnant-contour.ts';

let cellsPromise:ReturnType<typeof loadTampereAccess>|null=null;
export async function renderShowcase(at:number,elapsedMinutes=0,paused=true):Promise<WorldView>{
 if(!Number.isSafeInteger(at)||at<=0)throw new Error('Invalid showcase timestamp');
 if(!Number.isSafeInteger(elapsedMinutes)||elapsedMinutes<0||elapsedMinutes>720)throw new Error('Invalid showcase elapsed time');
 const startedAt=Math.floor(at/60000)*60000,{cells}=await(cellsPromise??=loadTampereAccess());
 const compact=cells.filter(c=>{const [x,y]=tileCoordinate([c.x+.5,c.y+.5]);return x>=23.75&&x<=23.807&&y>=61.477&&y<=61.495;});
 const fixtures=generateOutbreaks(compact,73,13,new Set(),5);
 const engine=createWorld({ids:fixtures.map(f=>f.id),seed:73,effort:4,balance:{splitProbability:0}}),t=engine.targets;
 t[0].strength=2;t[1].strength=4;t[2].strength=8;
 t[3].strength=8;t[3].deadline=24*60;
 Object.assign(t[4],{remnant:true,cells:1,cap:1,strength:.25,unit:.25,bonus:25,expires:72*60});
 applyVisit(engine,t[5].id,'showcase-cleaner');
 for(let i=0;i<5;i++)applyVisit(engine,t[6].id,'showcase-clear-'+i);
 t[7].crossings=3;
 // Two visible children share a paused stabilisation phase and parent bonus.
 for(const child of [t[8],t[9]]){child.strength=1.8;child.bonus=50;child.stabilize=30;}
 for(const target of [t[10],t[11]])target.history.emulator={count:1,last:0};
 t[12].strength=0;t[12].cleared=0;
 if(elapsedMinutes)advanceWorld(engine,elapsedMinutes);
 const now=startedAt+elapsedMinutes*60000;
 const names=['Light effort','Medium effort','Heavy effort','Disintegrating','Remnants','Withering','Clearing','Cracks forming','Splitting · left','Splitting · right','On cooldown','Visited this outing','Cleared · protection'];
 fixtures.forEach((f,i)=>{f.name=names[i];});
 // The paired split examples occupy opposite halves of one parent footprint,
 // rather than two unrelated locations. These are UI fixture geometries only.
 const parent=fixtures[8].ring,cx=parent.reduce((sum,p)=>sum+p[0],0)/parent.length;
 const cut=(boundary:number,left:boolean)=>{
  const result:typeof parent=[];
  for(let i=0;i<parent.length;i++){
   const a=parent[i],b=parent[(i+1)%parent.length],inside=(x:number)=>left?x<=boundary:x>=boundary;
   if(inside(a[0]))result.push(a);
   if(inside(a[0])!==inside(b[0])){const t=(boundary-a[0])/(b[0]-a[0]);result.push([boundary,a[1]+t*(b[1]-a[1])]);}
  }return result;
 };
 fixtures[8].ring=cut(cx,true);fixtures[9].ring=cut(cx,false);
 for(const [index,scale] of [[0,.5],[1,.71],[4,.32]] as const){
  const f=fixtures[index],x=f.ring.reduce((sum,p)=>sum+p[0],0)/f.ring.length,y=f.ring.reduce((sum,p)=>sum+p[1],0)/f.ring.length;
  f.ring=f.ring.map(p=>[x+(p[0]-x)*scale,y+(p[1]-y)*scale]);
 }
 fixtures[4].ring=remnantCollectionContour(fixtures[4].ring,5,fixtures.filter((_,i)=>i!==4).map(f=>f.ring))??fixtures[4].ring;
 const examples=names.flatMap((name,i)=>i===9?[]:[{name:i===8?'Splitting':name,ids:i===8?[t[8].id,t[9].id]:[t[i].id],...(i===11?{visited:true}:{})}]);
 const labs=spawnFieldLabs(cells,73,0,startedAt).filter(lab=>lab.expiresAt>now).map((lab,i)=>({...lab,name:'Field Lab' as const,collected:i===0}));
 return parseWorldView({version:1,serverTime:now,worldStartedAt:startedAt,renderTest:{examples,clock:{paused,elapsedMinutes,limitMinutes:720}},
  outbreaks:fixtures.map((f,i)=>outbreakView(engine,t[i],f,'emulator',startedAt,now)),fieldLabs:labs,
  resistance:{rulesVersion:1,scoringVersion:2,activatedAt:now,centre:[23.777,61.486],radiusMetres:3000,centreResistance:.7},
 });
}
