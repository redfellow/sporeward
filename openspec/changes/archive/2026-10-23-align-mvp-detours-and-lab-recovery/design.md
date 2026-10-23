# Design

## Context

See [proposal.md](proposal.md). A design is useful here because the local scoring model, its summary centre and global restoration can otherwise be collapsed into a misleading single meter.

Inspected evidence:

| Source | Finding used in this change |
|---|---|
| `docs/product-direction.md` | Confirmed priority order, renewable local play and proposed observational evaluations; no agreed route planner or numeric success thresholds. |
| `openspec/specs/field-labs/spec.md` | Global immediate restoration, per-player collection and diminishing successive recovery; its weekend evidence requirement currently names a provisional percentage target. |
| `openspec/specs/outbreak-resistance/spec.md` | Personal contribution accumulation, passive recovery and bounded points; committed cleaning and cleanup bonuses remain outside the resistance point reduction. |
| `packages/game/src/resistance.ts` | Local distance weighting, gradually moving concentration centre and fractional restoration of contributions known before collection. |
| `apps/server/src/resistance-state.ts`, `apps/server/src/world-store.ts` | Personal geography presentation and local authoritative point evaluation. Existing implementation remains configuration-dependent; no activation or retuning is part of this work. |

## Goals / Non-Goals

**Goals:** Preserve the confirmed qualitative product contract in concise capability deltas and one direction document. Distinguish lab-induced relief from passive recovery and new resistance accumulated along the adventure.

**Non-Goals:** Additional runtime behavior, new tuning, activation, guarantees about every individual award, or completion of product/field validation. The broad consolidation draft and all other shared docs remain untouched. No tests, commits or publishing.

## Decisions

1. **Use one cohesive experience capability with narrow amendments to existing mechanics.** `renewable-exploration` owns the connection between route choice, familiar play and understandable recovery. Existing `field-labs` and `outbreak-resistance` continue owning settlement and spatial rules. Repeating all gameplay rules in a product specification would introduce another conflicting rule source.
2. **Describe recovery by its causal benefit.** Lab hunting removes accumulated resistance, helping subsequent familiar-area ordinary visit points relative to equivalent play without that removal. Multiple collections can provide more relief under diminishing returns. The example percentages are not requirements, and later cleaning can rebuild resistance. A full reset or resistance-free week would misstate the user's decision.
3. **Keep spatial evaluation distinct from the centre.** Contributions affect targets with distance weighting; the centre summarizes concentration and may gradually follow adventure cleaning. No fixed home anchor or uniform personal meter is introduced. Existing frozen outing offers remain stable.
4. **Update only `docs/product-direction.md`.** Add the clarified loop and stable links to the existing mechanic baselines; add the new experience-baseline link once sync creates its target. Refine only the route-choice, return and comprehension entries that bear on this contract. Preserve unrelated existing content and historical evidence. No duplicate project-wide checklist or broad documentation reorganization is needed.
5. **Keep acceptance separate from documentation completion.** Schema validation, link review and source consistency review are sufficient for this document-only change. They do not prove a satisfying detour, a particular recovery amount or phone/field reliability. Existing future balancing obligations remain contracts; no simulations or project tests run in this lane.

## Risks / Trade-offs

- A lower resistance value may round to the same points for an individual visit → describe reduced resistance-based loss subject to locality, elapsed time, subsequent contributions and reward rounding.
- A visually weakening zone may imply a full reset → state partial recovery and continuing accumulation explicitly.
- New adventure contributions can obscure the benefit of collection → keep the no-collection comparison explicit rather than attributing all weekend changes to labs.
- A summary centre can be mistaken for the complete scoring model → describe local contribution weighting and gradual centre movement separately.
- A documentation archive can be mistaken for field acceptance → retain the existing field limitations and report completion of this scoped documentation contract only.

## Migration Plan

Complete the delta specs, update the direction document, review schema/links/scope, then sync only these three capabilities and archive this change under the current date. Preserve all unrelated main-spec requirements, existing purposes and historical records. There is no runtime migration, field-data change or Android rendering/performance impact.

## Open Questions

These observational questions do not block documenting the settled qualitative contract:

- Which representative A-to-B journeys make an attractive optional detour clear to the player?
- How noticeable should a single lab's help feel, and how do several collections affect the desire to make another outing? No amount or threshold is agreed.
- Can the player explain the difference between actual resistance reduction, ordinary visit points, committed cleaning and a conditional cleanup bonus?

No answer is inferred here. A new threshold or runtime behavior requires its own owner decision.

## Completion review

- The source review confirms local distance-weighted point pricing, a concentration-based summary centre with bounded gradual movement, and lab restoration applied fractionally to prior contributions. This documents existing behavior without changing or enabling it.
- The direction-document diff is limited to the confirmed loop and its route-choice, outing-return and comprehension observations. Existing priorities, unrelated questions and historical/field limitations are preserved.
- Strict validation passed for this change; 25 local document references resolved before baseline sync, and `git diff --check` reported no whitespace issues. No project tests or simulations were added or run.
- All four frozen consolidation-draft file hashes matched their pre-apply values. No runtime files or other shared documents were changed.
- This closes documentation consistency only. Perceived recovery, actual route-choice motivation and physical-device/field acceptance remain unverified; no amount or success threshold is newly accepted.
- Archive-stage sync created the experience baseline, added two spatial resistance requirements and replaced only the weekend evidence requirement in Field Labs. All six delta requirement blocks match the main specs; existing purposes, titles and unrelated requirements were preserved. The direction document now links all three baselines.
