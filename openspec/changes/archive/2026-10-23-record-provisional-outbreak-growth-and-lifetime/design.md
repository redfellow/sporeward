# Design

## Context

See proposal.md. `packages/game/src/balance.ts` supplies the current provisional defaults; `packages/game/src/engine.ts` applies cell-proportional strength growth and point-proportional deadline extensions; `apps/server/src/spatial/lifecycle.ts` maps that scalar footprint to accessible geographic cells. Growth values are configurable. The isolated rules engine can model splitting, but geographic field worlds currently disable it.

## Goals / Non-Goals

**Goals:** Record the current geographic growth, cleaning-progress, and lifetime-extension contract without changing runtime behavior. Keep provisional parameters visibly provisional.

**Non-Goals:** Choosing footprint-size cutovers, exposing an authoritative size category, defining Light-only split eligibility, classifying player corridors, enabling geographic splitting, changing scores or field-world state, or implementing new integrations.

## Decisions

1. **Baseline the implemented geographic defaults.** Use the current five-cell start, ten-cell cap, four-day growth interval, twenty-four-hour disintegration countdown, two-hour full-value extension, and twenty-four-hour total extension cap. The game concept and balance configuration already record these values; this change does not tune or replace them.

2. **Keep footprint and remaining effort distinct.** The polygon follows geographic growth and treatment; the visit estimate and effort palette describe remaining cleaning work. Existing Light/Medium/Heavy effort bands remain effort presentation. The 1:2:4 size strip is illustrative only and supplies no footprint cutovers.

3. **Preserve the current extension input.** Deadline extension follows the ordinary repeat-point value used by the rules engine, not a new scoring measure. Resistance scoring may change the awarded visit points while the existing extension input remains the ordinary repeat-point value; resistance behavior and scoring contracts are not modified here.

4. **Keep splitting as a future idea.** A complete player-driven split contract needs corridor classification and geographic child-footprint behavior. The concept's provisional crossing chance does not define corridor-matching tolerance, geometry partitioning, or persistent child/contact lineage. No MVP split behavior is added, and no category-based split gate is inferred.

## Risks / Trade-offs

- Recording existing tunings could make them look final → label each value provisional and configurable in the spec.
- A spec-only baseline could be mistaken for a newly integrated feature → keep the proposal and design explicit that runtime code is unchanged.
- Deferring size classes leaves no authoritative Light/Medium/Heavy footprint classification → retain direct footprint geometry and current effort presentation until cutovers are separately agreed.
- Deferring splitting leaves the accepted corridor idea non-playable in geographic field worlds → retain it as a future design item without presenting the visual guide as evidence of implementation.

## Migration Plan

No runtime or persisted-state migration is required. Archive the capability spec after checking it against the existing implementation and validating the OpenSpec artifacts. Do not run gameplay tests or change field data in this documentation-only change.
