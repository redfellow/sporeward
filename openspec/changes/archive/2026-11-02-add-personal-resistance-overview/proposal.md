# Proposal

## Why

The live map already renders personal Outbreak Resistance, but players lack a concise explanation of why familiar visits can earn fewer points and how Field Labs may help. A personal overview connects those existing mechanics to the [renewable local-play loop](../../../docs/product-direction.md) without making lab hunting mandatory.

## What Changes

- Add a live-map Resistance sheet, available before and during an outing, explaining the player's received personal Resistance context and passive recovery.
- Provide a Show affected area action using the existing native-map overlay, without implying that its circular summary exactly determines every local reward.
- Present available Field Labs from the loaded world through the existing destination selection flow, with honest direct distances and outing-offer wording.
- Distinguish established Resistance, no established field, missing/unsupported information and cached/offline information. Never turn missing data into a zero-Resistance claim.
- Coordinate with Nearby, Recent contacts, destination details and notices; preserve recording controls, the current pin and Back behavior.
- Explain that Resistance affects ordinary visit points, not committed cleaning or cleanup bonuses. Do not introduce a global reward-loss percentage, new strength tiers, recovery countdown or guaranteed future points.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outbreak-resistance`: Add an owner-facing personal overview, spatial-summary explanation, actionable lab discovery and evidence-aware availability/freshness states. Existing accumulation and reward rules remain unchanged.

## Impact

Android presentation in `App.tsx` and `RouteMap.tsx`, a pure overview model, the existing `ResistanceLayer`, destination summaries and Nearby list helpers. Reuse current world refresh, personal lab offers and account context; expose structured receive/cache status locally if required rather than parsing display strings. No new server endpoint, protocol field, scoring rule, GPS permission/watch, database migration or background work is planned.

The merged [destination focus](../add-map-destination-focus/proposal.md), [Nearby](../add-nearby-destinations-sheet/proposal.md) and [live-feedback](../add-live-encounter-feedback/proposal.md) changes provide integration points; their owner phone gates remain separate. This change is planning only until reviewed and explicitly requested for apply.
