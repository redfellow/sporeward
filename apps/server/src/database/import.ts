import {createWorld,matchContacts} from '@sporeward/game';
import type {Persisted} from '../world-store.ts';
import {parseEncounterRecap} from '@sporeward/protocol';
/** Validate an application-owned snapshot before import. Never evaluate source data. */
export function parseWorldSnapshot(value:unknown):Persisted{
 const s=value as Persisted,object=(v:unknown)=>!!v&&typeof v==='object'&&!Array.isArray(v),finite=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
 if(!object(s)||s.version!==1||!Number.isSafeInteger(s.startedAt)||s.startedAt<=0||!Array.isArray(s.fixtures)||s.fixtures.length>10000||!object(s.engine)||s.engine.version!==3||!Number.isSafeInteger(s.engine.time)||s.engine.time<0||!finite(s.engine.effort)||s.engine.effort<=0||!Array.isArray(s.engine.targets)||!Array.isArray(s.contributions)||!object(s.activities)||!object(s.engine.scores))throw new Error('Unsupported or invalid world snapshot.');
 createWorld({ids:[],balance:s.engine.balance});
 const fixtures=new Set<string>(),targets=new Set<string>(),contributions=new Set<string>();
 for(const f of s.fixtures){if(typeof f.id!=='string'||!f.id||fixtures.has(f.id)||typeof f.name!=='string')throw new Error('Invalid snapshot outbreak.');fixtures.add(f.id);matchContacts([],[{id:f.id,ring:f.ring,validFrom:s.startedAt,validUntil:null}]);}
 for(const o of s.engine.targets){if(!fixtures.has(o.id)||targets.has(o.id)||!finite(o.strength)||!finite(o.cells)||!finite(o.bonus)||!object(o.history)||!Array.isArray(o.treatments)||!Array.isArray(o.visits)||!Array.isArray(o.awarded))throw new Error('Invalid snapshot engine target.');targets.add(o.id);}
 if(targets.size!==fixtures.size)throw new Error('Snapshot geometry and engine identities differ.');
 for(const c of s.contributions){if(typeof c.id!=='string'||!c.id||contributions.has(c.id)||typeof c.player!=='string'||!c.player||typeof c.activityId!=='string'||!c.activityId||!fixtures.has(c.outbreakId)||!finite(c.contactAt)||!finite(c.visitPoints))throw new Error('Invalid snapshot contribution.');contributions.add(c.id);}
 for(const [key,a] of Object.entries(s.activities)){
  if(!/^[a-f0-9]{64}$/.test(key)||typeof a.player!=='string'||!finite(a.started)||!finite(a.ended)||a.ended<a.started)throw new Error('Invalid snapshot activity.');
  parseEncounterRecap({activityId:'snapshot-validation',confirmedVisitPoints:0,confirmedCleanupPoints:0,pendingCleanupPoints:0,updatedAt:s.startedAt,encounters:a.results},'snapshot-validation');
  if(a.results.some(e=>e.contributionId!==null&&!contributions.has(e.contributionId)))throw new Error('Missing snapshot contribution reference.');
 }
 s.bonuses??={};if(!object(s.bonuses)||Object.values(s.bonuses).some(id=>!contributions.has(id))||Object.values(s.engine.scores).some(p=>!finite(p)))throw new Error('Invalid snapshot rewards.');
 if(s.footprints)matchContacts([],s.footprints);
 return s;
}
