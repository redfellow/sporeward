import { createHash } from 'node:crypto';
import { resistanceDistance } from '@sporeward/game';
import type { Coordinate } from '@sporeward/protocol';
import { tileCoordinate, type AccessibleCell } from './spatial/access.ts';

export const FIELD_LAB_RULES = {
 version: 1, count: 2, lifetimeMs: 7 * 86400000, minimumSeparationMetres: 2000, collectionDiameterCellWidths: 2,
} as const;
export type FieldLab = { id: string; position: Coordinate; ring: Coordinate[]; accessWay: number; spawnedAt: number; expiresAt: number };
export type LabLifecycle = { version: 1; epoch: number; labs: FieldLab[] };

/** Twice the former cell-width diameter, encompassing the accessible spawn cell. */
export function fieldLabCollectionRing(position:Coordinate):Coordinate[]{
 const radians=Math.PI/180,lat=position[1]*radians,lon=position[0]*radians;
 // One z17 cell is 360 / 2^17 degrees wide; the new radius is one full cell width.
 const radius=6371000*Math.cos(lat)*(360/2**17)*radians*FIELD_LAB_RULES.collectionDiameterCellWidths/2,angle=radius/6371000;
 return Array.from({length:64},(_,i):Coordinate=>{
  const bearing=i/64*Math.PI*2,y=Math.asin(Math.sin(lat)*Math.cos(angle)+Math.cos(lat)*Math.sin(angle)*Math.cos(bearing));
  const x=lon+Math.atan2(Math.sin(bearing)*Math.sin(angle)*Math.cos(lat),Math.cos(angle)-Math.sin(lat)*Math.sin(y));
  return [x/radians,y/radians];
 });
}
/** Access cells contain publicly traversable ways; the larger circle contains the entire cell. */
export function spawnFieldLabs(access: AccessibleCell[], seed: number, epoch: number, startedAt: number): FieldLab[] {
 if (!Number.isSafeInteger(seed) || !Number.isSafeInteger(epoch) || epoch < 0 || !Number.isSafeInteger(startedAt) || startedAt < 0) throw new Error('Invalid lab spawn settings');
 const hash = (cell: AccessibleCell) => createHash('sha256').update(`${seed}:${epoch}:${cell.x}:${cell.y}`).digest('hex');
 const candidates = [...access].filter(cell => cell.ways.length).sort((a, b) => hash(a).localeCompare(hash(b)));
 const labs: FieldLab[] = [];
 for (const cell of candidates) {
  const position = tileCoordinate([cell.x + .5, cell.y + .5]);
  if (labs.some(lab => resistanceDistance({ longitude: position[0], latitude: position[1] }, { longitude: lab.position[0], latitude: lab.position[1] }) < FIELD_LAB_RULES.minimumSeparationMetres)) continue;
  const spawnedAt = startedAt + epoch * FIELD_LAB_RULES.lifetimeMs;
  labs.push({ id: `lab-${seed}-${epoch}-${hash(cell).slice(0, 12)}`, position, ring: fieldLabCollectionRing(position), accessWay: cell.ways[0], spawnedAt, expiresAt: spawnedAt + FIELD_LAB_RULES.lifetimeMs });
  if (labs.length === FIELD_LAB_RULES.count) break;
 }
 if (labs.length !== FIELD_LAB_RULES.count) throw new Error('Access map does not support the configured separated labs');
 return labs;
}

export function advanceFieldLabs(state: LabLifecycle | undefined, access: AccessibleCell[], seed: number, startedAt: number, now: number): LabLifecycle {
 const epoch = Math.max(0, Math.floor((now - startedAt) / FIELD_LAB_RULES.lifetimeMs));
 if (state?.epoch === epoch) return state;
 const prior = state?.labs ?? [];
 const current = spawnFieldLabs(access, seed, epoch, startedAt);
 // Keep earlier epochs matchable; late activity validation governs eligible import age.
 const byId = new Map([...prior, ...current].map(lab => [lab.id, lab]));
 return { version: 1, epoch, labs: [...byId.values()] };
}
