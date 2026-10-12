import { BALANCE } from './balance';
/** Planning engine: all state time values and durations are in minutes.
 * advanceWorld applies fixed one-minute ticks. No clock, I/O, or ambient randomness.
 * This is the extracted balancing simulation, not yet the authoritative GPS/world engine.
 */
export type EngineBalance = { [K in keyof typeof BALANCE]: K extends 'repeatCleaningStrength' ? readonly number[] : number };
export type Treatment = { fast: number; slow: number; fastTime: number; slowTime: number };
export type Outbreak = {
 id:string; cells:number; cap:number; unit:number; strength:number; bonus:number;
 treatments:Treatment[]; history:Record<string,{count:number;last:number}>;
 visits:{player:string;time:number}[]; awarded:string[]; crossings:number;
 extension:number; extensionCap:number; deadline:number; stabilize:number;
 cleared:number|null; expires:number|null; remnant:boolean;
};
export type WorldState = {
 version:3; time:number; mode:'gentle'|'constant'; effort:number; rng:number;
 targets:Outbreak[]; scores:Record<string,number>; events:string[]; balance:EngineBalance;
};
export type VisitResult = { accepted:boolean; reason?:'missing'|'cooldown'|'stabilizing'|'expired'; points:number; power:number };
const minutes = (ms:number) => ms/60000;
export function createOutbreak(id:string, effort:number, balance:EngineBalance = BALANCE): Outbreak {
 if(!id || !Number.isFinite(effort) || effort<=0) throw new Error('Outbreak ID and positive effort are required.');
 return {id,cells:balance.initialCells,cap:balance.maximumCells,unit:effort/balance.initialCells,strength:effort,bonus:balance.cleanupBonus,
  treatments:[],history:{},visits:[],awarded:[],crossings:0,extension:0,extensionCap:minutes(balance.maximumExtensionMs),
  deadline:minutes(balance.growthDurationMs+balance.disintegrationDurationMs),stabilize:0,cleared:null,expires:null,remnant:false};
}
export function createWorld(options:{effort?:number;ids?:string[];mode?:WorldState['mode'];seed?:number;balance?:Partial<EngineBalance>} = {}):WorldState {
 const balance:EngineBalance = {...BALANCE,...options.balance,repeatCleaningStrength:[...(options.balance?.repeatCleaningStrength ?? BALANCE.repeatCleaningStrength)]};
 for(const [key,value] of Object.entries(balance)) {
  if(typeof value !== 'number' ? !value.length || value.some(x=>!Number.isFinite(x)||x<=0) : !Number.isFinite(value) || value<0) throw new Error(`Invalid balance: ${key}`);
 }
 if(balance.initialCells<=0 || balance.maximumCells<balance.initialCells || balance.fastCleaningDurationMs<60000 || balance.slowCleaningDurationMs<60000 || balance.growthDurationMs<60000 || balance.pointRecoveryDurationMs<=0 || balance.fastCleaningFraction>1 || balance.splitProbability>1 || balance.splitEffortReduction>=1 || balance.firstVisitPoints<=0) throw new Error('Invalid balancing bounds.');
 const ids=options.ids ?? ['West','Central','East'];
 if(new Set(ids).size!==ids.length) throw new Error('Outbreak IDs must be unique.');
 return {version:3,time:0,mode:options.mode??'gentle',effort:options.effort??4,rng:(options.seed??73)>>>0,
  targets:ids.map(id=>createOutbreak(id,options.effort??4,balance)),scores:{},events:[],balance};
}
export function pendingCleaning(o:Outbreak) { return o.treatments.reduce((sum,t)=>sum+t.fast+t.slow,0); }
export function nextVisit(state:WorldState,o:Outbreak,player:string) {
 const h=Object.hasOwn(o.history,player)?o.history[player]:undefined,count=h?.count??0,b=state.balance;
 const base=Math.max(b.minimumVisitPoints,Math.floor(b.firstVisitPoints/2**count));
 const recovery=h ? Math.min(1,Math.max(0,state.time-h.last-minutes(b.pointRecoveryDelayMs))/minutes(b.pointRecoveryDurationMs)) : 1;
 return {points:Math.round(base+(b.firstVisitPoints-base)*recovery),power:state.mode==='constant'?1:b.repeatCleaningStrength[Math.min(count,b.repeatCleaningStrength.length-1)],wait:h?Math.max(0,h.last+minutes(b.visitCooldownMs)-state.time):0};
}
export function outbreakStatus(state:WorldState,o:Outbreak) {
 if(o.cleared!==null) return state.time<=o.cleared+minutes(state.balance.cleanupProtectionMs) ? 'Cleared · protection window' : 'Cleared';
 if(o.remnant) return 'Remnant';
 if(state.time<o.stabilize) return 'Stabilizing';
 if(pendingCleaning(o)>=o.strength-0.00001 && o.strength>0) return 'Clearing';
 if(state.time>=o.deadline-minutes(state.balance.disintegrationDurationMs)) return 'Disintegrating';
 return pendingCleaning(o)>0?'Withering':'Growing';
}
function log(s:WorldState,message:string) { s.events.push(`D${Math.floor(s.time/1440)+1} ${s.time%1440} min · ${message}`);s.events=s.events.slice(-8); }
function addPoints(s:WorldState,player:string,points:number) {Object.defineProperty(s.scores,player,{value:(Object.hasOwn(s.scores,player)?s.scores[player]:0)+points,writable:true,enumerable:true,configurable:true});}
function award(s:WorldState,o:Outbreak,player:string) {
 if(o.awarded.includes(player)) return;
 o.awarded.push(player);addPoints(s,player,o.bonus);log(s,`${player} earned +${o.bonus} cleanup points on ${o.id}.`);
}
function clear(s:WorldState,o:Outbreak) {
 o.strength=0;o.treatments=[];o.cleared=s.time;
 const last=o.visits.at(-1);
 if(last) for(const v of o.visits) if(Math.abs(v.time-last.time)<=minutes(s.balance.cleanupProtectionMs)) award(s,o,v.player);
 log(s,`${o.id} cleared; protection window opened.`);
}
function random(s:WorldState) {s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296;}
function split(s:WorldState,o:Outbreak) {
 const children=['Left','Right'].map(name=> {
  const child:Outbreak=JSON.parse(JSON.stringify(o));child.id=`${o.id} · ${name}`;
  child.cells/=2;child.cap/=2;child.strength*=(1-s.balance.splitEffortReduction)/2;child.bonus/=2;
  child.treatments.forEach(t=>{t.fast/=2;t.slow/=2;});
  child.extensionCap=Math.max(0,o.extensionCap-o.extension)/2;child.extension=0;
  child.stabilize=s.time+minutes(s.balance.splitStabilizationMs);child.crossings=0;return child;
 });
 s.targets.splice(s.targets.indexOf(o),1,...children);log(s,`Crack split ${o.id}; children stabilize and inherit cooldowns.`);
}
function disintegrate(s:WorldState,o:Outbreak) {
 const items=[1,2,3,4].map(n=>{
  const item=createOutbreak(`${o.id} · Remnant ${n}`,0.25,s.balance);item.cells=1;item.cap=1;item.bonus=o.bonus/4;
  item.remnant=true;item.expires=s.time+minutes(s.balance.remnantLifetimeMs);return item;
 });
 s.targets.splice(s.targets.indexOf(o),1,...items);log(s,`${o.id} disintegrated into four bonus-only remnants.`);
}
/** Caller supplies a validated concentrated edge-to-edge corridor classification.
 * Raw touches are never automatically counted as qualifying crossings here.
 */
export function applyVisit(s:WorldState,id:string,player:string,options:{corridorCrossing?:boolean} = {}):VisitResult {
 if(!player) throw new Error('Player ID is required.');
 const o=s.targets.find(target=>target.id===id);
 const reject=(reason:VisitResult['reason']):VisitResult=>({accepted:false,reason,points:0,power:0});
 if(!o) return reject('missing');
 const v=nextVisit(s,o,player);
 if(v.wait>0) return reject('cooldown');
 if(s.time<o.stabilize) return reject('stabilizing');
 if(o.cleared!==null && s.time>o.cleared+minutes(s.balance.cleanupProtectionMs) || o.remnant && o.expires!==null && s.time>=o.expires) return reject('expired');
 const protection=o.cleared!==null,old=Object.hasOwn(o.history,player)?o.history[player]:undefined;
 Object.defineProperty(o.history,player,{value:{count:old?old.count+1:1,last:s.time},writable:true,enumerable:true,configurable:true});o.visits.push({player,time:s.time});
 const points=o.remnant?0:protection?s.balance.firstVisitPoints:v.points;
 addPoints(s,player,points);
 if(protection) award(s,o,player);
 else if(o.remnant) clear(s,o);
 else {
  o.treatments.push({fast:v.power*s.balance.fastCleaningFraction,slow:v.power*(1-s.balance.fastCleaningFraction),fastTime:minutes(s.balance.fastCleaningDurationMs),slowTime:minutes(s.balance.slowCleaningDurationMs)});
  const extra=Math.max(0,Math.min(o.extensionCap-o.extension,minutes(s.balance.fullVisitExtensionMs)*v.points/s.balance.firstVisitPoints));
  o.extension+=extra;o.deadline+=extra;
  log(s,`${player}: +${points} points, ${Math.round(v.power*100)}% cleaning strength.`);
  if(options.corridorCrossing) {
   o.crossings++;
   if(o.crossings>3 && random(s)<s.balance.splitProbability && o.cells>=3) split(s,o);
   else log(s,`Crack corridor: ${o.crossings} accepted crossings.`);
  }
 }
 return {accepted:true,points,power:protection||o.remnant?0:v.power};
}
function tick(s:WorldState) {
 s.time++;
 for(const o of s.targets.slice()) {
  if(o.cleared!==null) continue;
  if(o.remnant) {
   if(s.time>=o.expires!) {o.strength=0;o.cleared=s.time-minutes(s.balance.cleanupProtectionMs)-1;log(s,`${o.id} faded naturally; no points.`);}
   else o.strength=Math.max(0,0.25*(o.expires!-s.time)/minutes(s.balance.remnantLifetimeMs));
   continue;
  }
  if(s.time<o.stabilize) continue;
  const wasCleaning=pendingCleaning(o)>0;let delivered=0;
  for(const t of o.treatments) {
   for(const part of ['fast','slow'] as const) {
    const key=part==='fast'?'fastTime':'slowTime';
    if(t[key]>0) {const amount=t[part]*Math.min(1,t[key])/t[key];delivered+=amount;t[part]-=amount;t[key]=Math.max(0,t[key]-1);}
   }
  }
  o.treatments=o.treatments.filter(t=>t.fastTime>0||t.slowTime>0);o.strength-=delivered;
  if(o.strength<=0.000001) {clear(s,o);continue;}
  if(wasCleaning) o.cells=Math.max(0.5,Math.min(o.cells,o.strength/o.unit));
  else if(s.time<o.deadline-minutes(s.balance.disintegrationDurationMs)) {
   const extra=Math.max(0,Math.min(o.cap-o.cells,s.balance.initialCells/minutes(s.balance.growthDurationMs)));
   o.cells+=extra;o.strength+=extra*o.unit;
  }
  if(s.time>=o.deadline) disintegrate(s,o);
 }
}
/** Mutates only the supplied plain, JSON-serializable state. */
export function advanceWorld(s:WorldState,minutesToAdvance:number) {
 if(!Number.isSafeInteger(minutesToAdvance)||minutesToAdvance<0) throw new Error('Advance must be a non-negative whole number of minutes.');
 for(let i=0;i<minutesToAdvance;i++) tick(s);
}
