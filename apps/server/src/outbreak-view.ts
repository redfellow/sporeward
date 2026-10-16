import {nextVisit,pendingCleaning,type WorldState,type Outbreak} from '@sporeward/game';
import type {OutbreakView} from '@sporeward/protocol';
import type {TestOutbreak} from './test-outbreaks';
/** Player-facing values must describe the same rewards and deadlines as the engine. */
export function outbreakView(engine:WorldState,o:Outbreak,f:TestOutbreak,player:string,startedAt:number,now:number):OutbreakView{
 const next=nextVisit(engine,o,player,(now-startedAt)/60000),committed=pendingCleaning(o);
 const clearedAt=o.cleared===null?null:startedAt+o.cleared*60000;
 const protectedCleanup=clearedAt!==null&&now<=clearedAt+engine.balance.cleanupProtectionMs;
 const disintegrating=!o.remnant&&engine.time>=o.deadline-engine.balance.disintegrationDurationMs/60000;
 const lifecycle=o.remnant?'remnant':engine.time<o.stabilize?'stabilizing':disintegrating?'disintegrating':'ordinary';
 const phaseEndsAt=o.cleared!==null?null:o.remnant?(o.expires===null?null:startedAt+o.expires*60000):lifecycle==='stabilizing'?startedAt+o.stabilize*60000:lifecycle==='disintegrating'?startedAt+o.deadline*60000:null;
 const history=Object.hasOwn(o.history,player)?o.history[player]:undefined;
 return {id:o.id,name:f.name,ring:f.ring,spawnedAt:f.spawnedAt??startedAt,clearedAt,
  status:o.cleared!==null?'cleared':committed>=o.strength?'clearing':committed>0?'withering':'active',
  lifecycle,phaseEndsAt,strength:o.strength,committedCleaning:committed,
  visitsRemaining:o.cleared!==null?0:o.remnant?1:Math.max(0,Math.ceil((o.strength-committed)/next.power)),
  visitPoints:o.remnant?0:protectedCleanup?engine.balance.firstVisitPoints:next.points,cleanupBonus:o.bonus,
  eligibleAt:Math.max(history?startedAt+history.last*60000+engine.balance.visitCooldownMs:0,lifecycle==='stabilizing'?startedAt+o.stabilize*60000:0)};
}
