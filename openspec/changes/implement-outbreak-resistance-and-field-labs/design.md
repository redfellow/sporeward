# Design

## Context

See [proposal.md](proposal.md). `packages/game/src/balance.ts` currently sets six-hour cooldowns and repeat cleaning strengths of 1, .75, .6, then .5. `world-store.ts` accepts contacts, persists contribution identity and updates scores; `outbreak-view.ts` exposes the next reward. PostGIS persistence and account ownership already exist. The [desktop study](../archive/2026-10-21-explore-field-labs-and-outbreak-resistance/proposal.md) is independently implementing illustrative visuals, not these authoritative rules.

## Goals / Non-Goals

**Goals:** Pure deterministic rules, calibration before integration, account-owned persistent state, trustworthy offers/recaps and compatible gameplay presentation.

**Non-Goals:** Redrawing the desktop study, historical award changes, harder cleaning, cooldown changes, achievements, strategic splitting or deployment. This proposal retains cleaning and cleanup-bonus rules; resistance affects eligible ordinary visit points only.

## Decisions

### 1. Model and calibration before integration

Implement explicit-time, serializable resistance and restoration functions in `packages/game`, with seeded lab placement in the server. Keep tunable values in one versioned configuration. Reference commuting fixtures use two accepted weekday contacts per target separated by at least six hours, five days per week, plus multiple-target and fresh-replacement variants. Baseline repeat-strength input is 3.35 full contributions for five visits and 5.85 for ten; do not use the earlier illustrative seven-day decay calculation as an agreed curve.

Calibration targets, all provisional:

- First working week's Friday reward state around 60–70% ordinary visit reward (owner clarification, 2026-10-21); weekly averages are comparison metrics.
- Around 50% after four weeks without labs, with slower further decline and a 25% absolute eligible-visit floor.
- A worthwhile weekend lab excursion restores approximately 85–90% immediately and improves the following week. Ten kilometres was an example, not a threshold.
- Passive recovery operates continuously; no hard weekly reset. A short local walk remains useful. High-mileage collection and two-hotspot alternation cannot maintain full rewards indefinitely through restoration alone.

Use a continuous saturating resistance-to-reward curve, with reduced marginal accumulation after the 50% point. Reconcile legacy repeat points inside the single bounded calculation rather than stacking an unchanged halving sequence. Calibrate the repeat contribution, recovery rate and curve against the scenarios before API/persistence work; document selected parameters and measured deviations. If the targets conflict, surface the conflict rather than silently changing them.

### 2. Personal geography and event accounting

Use one stable representative outbreak point, not precise GPS crossings, weighted by cleaning strength at commitment. Store idempotent resistance events tied to accepted contribution identity. No additional resistance for delayed treatment delivery, rejected contacts or loops. Retain geographic familiarity across outbreak replacements.

Proposed first implementation default: derive one centre from the strongest recent weighted concentration, with a configurable circular radius/falloff and bounded movement; compare a weighted-average centre in the simulation, including two separated riding clusters. The centre algorithm and horizon are provisional, not a claim that the average is invalid. Retain sufficient compact event history to calculate spatial changes and decay deterministically. Keep these personal locations private to the owner.

### 3. Offers, event time and late uploads

Server snapshots an established centre and per-lab restoration offer for an outing, with account, world/rules version and expiry. Movement cannot recalculate a worse offer. Proposed default: permit offline recording from a cached server-issued offer, but never trust a client-supplied centre or multiplier; absent a valid offer, collection waits for authoritative reconciliation and is labelled provisional. Do not promise a guaranteed offline restoration amount.

Process contributions and lab contacts in deterministic recorded-time order within an outing. Delayed input must not rewrite confirmed awards or multiply restoration. Proposed reconciliation default: evaluate ordinary resistance against retained personal history at contact time; apply newly accepted resistance/restoration events to the present using explicit timestamps and passive decay, with event identity preventing reapplication. A lab must have existed and been unexpired at the validated contact time. Bind the offer's advertised maximum to the actual remaining resistance and prior collections at settlement; explain any smaller actual reduction. Exercise both delayed and out-of-order delivery before accepting this policy.

### 4. Shared labs and bounded restoration

Use separate lab identities, lifetime/placement state and player collection records rather than disguising labs as ordinary outbreaks. Reuse existing reachable placement and validated activity contact infrastructure. Proposed collection default: existing minimum activity distance and timestamp/accuracy validation apply; a lab touch does not consume outbreak cooldown or alter cleanup accounting. Spawn density, lifetime and contact footprint are configurable; labs should remain uncommon and longer-lived, with accessible destinations rather than route-obstructing fictional structures.

Compute global resistance reduction from a capped distance curve and a per-player successive-collection factor that recovers continuously. No inventory or surplus credit at zero resistance. Persistent collection uniqueness is account + world + lab identity. New replacement labs get new identities; distinct IDs do not reset the personal diminishing factor. Freeze quoted factors for the outing, while enforcing settlement limits so concurrently opened outings cannot duplicate recovery. No calendar reset or distance-only full reset.

Reward names are flavour only: Antiviral Booster, Rare Specimen, Counterstrain, Protocol Override, Adaptive Serum, Wildtype Extract, Resistance Breaker, Mutation Antidote, Experimental Batch, Strain Disruptor. Persist the chosen name for stable retry feedback.

### 5. Persistence and presentation

Add versioned account-owned resistance/events, lab lifecycle, offers and collection records with atomic contribution/collection settlement. Extend runtime-validated contracts for private zone/offer data, shared labs and actual recap reductions. Keep public lab geometry separate from personal response fields. A restart, account switch or retry must preserve identity and ownership.

Adopt reviewed visuals from the other changes after they are ready; do not fork their artwork. Android overlays stay in the native MapLibre camera pipeline, with bounded foreground animation and reduced-motion static states. Show lab expiry, advertised benefit, collected status and actual reduction. Existing offline points remain provisional. Numeric and co-op fixture checks can proceed before final art; final visual acceptance remains explicit.

## Risks / Trade-offs

- Repeat-point redesign changes an existing scoring rule → version it and enable prospectively; preserve confirmed awards, cleanup bonuses and six-hour eligibility.
- One circle misrepresents separated routines → compare centre models with actual-shape synthetic fixtures before integration; keep its limits documented.
- Frozen offers plus concurrent/delayed uploads invite double restoration → authoritative offers, atomic unique collection and settlement caps; test delivery permutations.
- Rare placements favour distance or two regular hotspots → capped distance value and persistent diminishing collection state; simulate four-week routines, not only single outings.
- Strong first-week decline and a 50% four-week target may conflict → make calibration a first reviewable slice; no claimed results until executed.
- Personal centre reveals habitual locations → owner-scoped responses and no exposure through shared lab APIs.

## Migration Plan

Develop in isolated replay first. Add backward-readable state/schema versions; new personal resistance starts neutral at feature activation, without backfilling old activities. Preserve all field accounts, stored tracks, contact boundaries and prior awards. Verify migration/rollback on disposable copies. Keep legacy reads and prior scoring versions available for historical recaps. Document rollback behaviour before any separately authorized field deployment; reverting must not silently recalculate confirmed points or replay collected restoration.

## Open Questions

Deferrable tuning: centre horizon/radius and movement rate, accumulation/decay coefficients, soft-threshold shape, repeat-point reconciliation weights, distance cap, collection-factor recovery and lab density/lifetime. The simulation slice selects and records these as provisional defaults. Offline/delayed policies above are proposed implementation defaults to validate, not pre-existing guarantees. Fundamental conflicts must return to review before integration rather than expanding scope.
