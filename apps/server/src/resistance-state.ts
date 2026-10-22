import {
 commitResistance, createResistance, resistanceAt, resistanceVisitPoints, resistanceWeight,
 type ResistancePoint, type ResistanceState,
 selectResistanceCentre, RESISTANCE_RULES, type ResistanceCentre,
} from '@sporeward/game';
import { createHash } from 'node:crypto';
import type { TestOutbreak } from './test-outbreaks.ts';

export type PersonalResistance = {
 version: 1;
 activatedAt: number;
 enabled: boolean;
 players: Record<string, ResistanceState>;
 representatives: Record<string, ResistancePoint>;
 centres?: Record<string, ResistanceCentre>;
};
export const resistanceOwnerKey = (player: string) => createHash('sha256').update(player).digest('hex');
export function ownerResistance(state: PersonalResistance, player: string): ResistanceState {
 return state.players[resistanceOwnerKey(player)] ?? createResistance();
}
export function representativePoint(state: PersonalResistance, fixture: TestOutbreak): ResistancePoint {
 const key = createHash('sha256').update(fixture.id).digest('hex');
 if (!state.representatives[key]) {
  state.representatives[key] = {
   longitude: fixture.ring.reduce((sum, point) => sum + point[0], 0) / fixture.ring.length,
   latitude: fixture.ring.reduce((sum, point) => sum + point[1], 0) / fixture.ring.length,
  };
 }
 return state.representatives[key];
}
export function personalVisitPoints(state: PersonalResistance, player: string, point: ResistancePoint, at: number, base: number) {
 return resistanceVisitPoints(base, resistanceAt(ownerResistance(state, player), at, event => resistanceWeight(point, event)), true);
}
export function recordPersonalContribution(state: PersonalResistance, player: string, id: string, at: number, point: ResistancePoint, strength: number) {
 state.players[resistanceOwnerKey(player)] = commitResistance(ownerResistance(state, player), { id, at, point, strength }, true).state;
}

export function personalResistanceView(state: PersonalResistance, player: string, at: number) {
 const key = resistanceOwnerKey(player), personal = ownerResistance(state, player);
 state.centres ??= {};
 const centre = selectResistanceCentre(personal, at, 'concentration', state.centres[key]);
 if (centre) state.centres[key] = centre;
 return {
  rulesVersion: 1 as const, scoringVersion: 2 as const, activatedAt: state.activatedAt,
  centre: centre ? [centre.point.longitude, centre.point.latitude] as [number, number] : null,
  radiusMetres: RESISTANCE_RULES.zoneRadiusMetres,
  centreResistance: centre ? resistanceAt(personal, at, point => resistanceWeight(centre.point, point)) : 0,
 };
}
