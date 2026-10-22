/** Prospective scoring experiment. Explicit milliseconds; no activation in legacy scoring. */
export const RESISTANCE_RULES = {
 version: 1,
 halfLifeMs: 7 * 24 * 60 * 60 * 1000,
 inputPerFullContribution: 0.23,
 rewardFloor: 0.25,
 geographyHorizonMs: 56 * 24 * 60 * 60 * 1000,
 zoneRadiusMetres: 5000,
 centreMovementMetresPerDay: 500,
 restorationDistanceCapMetres: 10000,
 maximumRestorationFraction: 0.8,
 collectionRecoveryHalfLifeMs: 24 * 60 * 60 * 1000,
 collectionDiminishingWeight: 2,
} as const;

export type ResistancePoint = { longitude: number; latitude: number };
export type ResistanceContribution = {
 /** Authoritative contribution identity, shared by retries and overlapping sources. */
 id: string;
 at: number;
 point: ResistancePoint;
 strength: number;
};
export type ResistanceRestoration = { id: string; at: number; settledAt: number; fraction: number; contributionIds: string[] };
export type ResistanceState = { version: 1; contributions: ResistanceContribution[]; restorations: ResistanceRestoration[] };

export function createResistance(): ResistanceState {
 return { version: 1, contributions: [], restorations: [] };
}

function finiteNonnegative(value: number) {
 if (!Number.isFinite(value) || value < 0) throw new Error('Expected finite nonnegative value');
}

/** Caller supplies committed strength only; treatment delivery never calls this function. */
export function commitResistance(
 state: ResistanceState,
 contribution: ResistanceContribution,
 eligible: boolean,
): { state: ResistanceState; added: boolean } {
 finiteNonnegative(contribution.at);
 finiteNonnegative(contribution.strength);
 const { longitude, latitude } = contribution.point;
 if (!contribution.id || !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
  !Number.isFinite(latitude) || Math.abs(latitude) > 90 || contribution.strength > 1) {
  throw new Error('Invalid resistance contribution');
 }
 if (!eligible || contribution.strength === 0 || state.contributions.some(event => event.id === contribution.id)) {
  return { state, added: false };
 }
 return {
  state: { ...state, contributions: [...state.contributions, {
   ...contribution, point: { ...contribution.point },
  }].sort((a, b) => a.at - b.at || a.id.localeCompare(b.id)) },
  added: true,
 };
}

export function recoveredResistance(input: number, elapsedMs: number): number {
 finiteNonnegative(input);
 finiteNonnegative(elapsedMs);
 return input * 2 ** (-elapsedMs / RESISTANCE_RULES.halfLifeMs);
}

/** Spatial weighting is supplied by the geographic model, independently of GPS crossings. */
export function resistanceAt(
 state: ResistanceState,
 at: number,
 weight: (point: ResistancePoint) => number = () => 1,
): number {
 finiteNonnegative(at);
 return state.contributions.reduce((sum, event) => {
  if (event.at > at) return sum;
  const spatialWeight = weight(event.point);
  if (!Number.isFinite(spatialWeight) || spatialWeight < 0 || spatialWeight > 1) {
   throw new Error('Spatial weight must be between zero and one');
  }
  const remaining = state.restorations.filter(restore => restore.at >= event.at && restore.at <= at && restore.contributionIds.includes(event.id))
   .reduce((factor, restore) => factor * (1 - restore.fraction), 1);
  return sum + remaining * recoveredResistance(event.strength * RESISTANCE_RULES.inputPerFullContribution * spatialWeight, at - event.at);
 }, 0);
}

/** One saturating curve replaces legacy point halving; repeat cleaning still supplies input. */
export function visitRewardFraction(resistance: number): number {
 finiteNonnegative(resistance);
 return RESISTANCE_RULES.rewardFloor + (1 - RESISTANCE_RULES.rewardFloor) / (1 + resistance);
}

export function resistanceVisitPoints(basePoints: number, resistance: number, eligible: boolean): number {
 finiteNonnegative(basePoints);
 const fraction = visitRewardFraction(resistance);
 return eligible ? Math.max(Math.ceil(basePoints * RESISTANCE_RULES.rewardFloor), Math.round(basePoints * fraction)) : 0;
}

export function resistanceDistance(a: ResistancePoint, b: ResistancePoint): number {
 const radians = Math.PI / 180;
 const dLat = (b.latitude - a.latitude) * radians;
 const dLon = (b.longitude - a.longitude) * radians;
 const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * radians) * Math.cos(b.latitude * radians) * Math.sin(dLon / 2) ** 2;
 return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

/** Circular linear falloff, shared by centre concentration and point pricing. */
export function resistanceWeight(centre: ResistancePoint, point: ResistancePoint): number {
 return Math.max(0, 1 - resistanceDistance(centre, point) / RESISTANCE_RULES.zoneRadiusMetres);
}

export type ResistanceCentre = { point: ResistancePoint; at: number };

export function selectResistanceCentre(
 state: ResistanceState, at: number, model: 'concentration' | 'average' = 'concentration',
 previous?: ResistanceCentre,
): ResistanceCentre | null {
 finiteNonnegative(at);
 if (previous && previous.at > at) throw new Error('Centre time cannot move backwards');
 const recent = state.contributions.filter(event => event.at <= at && at - event.at <= RESISTANCE_RULES.geographyHorizonMs);
 if (!recent.length) return previous ? { point: { ...previous.point }, at } : null;
 const weighted = recent.map(event => ({ point: event.point, weight: recoveredResistance(event.strength, at - event.at) }));
 let candidate: ResistancePoint;
 if (model === 'average') {
  const total = weighted.reduce((sum, event) => sum + event.weight, 0);
  candidate = {
   longitude: weighted.reduce((sum, event) => sum + event.point.longitude * event.weight, 0) / total,
   latitude: weighted.reduce((sum, event) => sum + event.point.latitude * event.weight, 0) / total,
  };
 } else {
  // Stable tie-break follows contribution time/id order, independent of upload order.
  candidate = weighted.reduce((best, event) => {
   const score = (point: ResistancePoint) => weighted.reduce((sum, other) => sum + other.weight * resistanceWeight(point, other.point), 0);
   return score(event.point) > score(best) ? event.point : best;
  }, weighted[0].point);
 }
 if (previous) {
  const distance = resistanceDistance(previous.point, candidate);
  const allowed = RESISTANCE_RULES.centreMovementMetresPerDay * (at - previous.at) / 86400000;
  const fraction = distance === 0 ? 1 : Math.min(1, allowed / distance);
  candidate = {
   longitude: previous.point.longitude + (candidate.longitude - previous.point.longitude) * fraction,
   latitude: previous.point.latitude + (candidate.latitude - previous.point.latitude) * fraction,
  };
 }
 return { point: { ...candidate }, at };
}

/** Copy this snapshot into an authoritative outing offer; never derive it from live movement. */
export function snapshotResistanceCentre(centre: ResistanceCentre | null): ResistanceCentre | null {
 return centre ? { point: { ...centre.point }, at: centre.at } : null;
}

export function collectionFactor(state: ResistanceState, at: number): number {
 finiteNonnegative(at);
 const load = state.restorations.filter(event => event.settledAt <= at).reduce((sum, event) =>
  sum + 2 ** (-(at - event.settledAt) / RESISTANCE_RULES.collectionRecoveryHalfLifeMs), 0);
 return 1 / (1 + RESISTANCE_RULES.collectionDiminishingWeight * load);
}

export function restorationFraction(distanceMetres: number, successiveFactor: number): number {
 finiteNonnegative(distanceMetres);
 finiteNonnegative(successiveFactor);
 if (successiveFactor > 1) throw new Error('Collection factor cannot exceed one');
 return RESISTANCE_RULES.maximumRestorationFraction *
  Math.min(1, distanceMetres / RESISTANCE_RULES.restorationDistanceCapMetres) * successiveFactor;
}

/** Pure settlement building block. Server must validate identity, contact, expiry and offer. */
export function collectRestoration(
 state: ResistanceState, id: string, at: number, distanceMetres: number, offeredFraction: number, settledAt = at,
): { state: ResistanceState; added: boolean; reduction: number; fraction: number } {
 finiteNonnegative(at);
 finiteNonnegative(settledAt);
 if(settledAt<at)throw new Error('Settlement cannot precede contact');
 finiteNonnegative(offeredFraction);
 if (!id || offeredFraction > 1) throw new Error('Invalid restoration');
 if (state.restorations.some(event => event.id === id)) return { state, added: false, reduction: 0, fraction: 0 };
 // A frozen quote is a maximum; concurrently opened outings share the current diminishing load.
 const available = resistanceAt(state, at);
 const fraction = available === 0 ? 0 : Math.min(offeredFraction, restorationFraction(distanceMetres, collectionFactor(state, settledAt)));
 const next: ResistanceState = { ...state, restorations: [...state.restorations, {
  id, at, settledAt, fraction, contributionIds: state.contributions.filter(event => event.at <= at).map(event => event.id),
 }].sort((a, b) => a.at - b.at || a.id.localeCompare(b.id)) };
 const reduction = resistanceAt(state, settledAt) - resistanceAt(next, settledAt);
 return {
  state: next,
  added: true, reduction, fraction,
 };
}
