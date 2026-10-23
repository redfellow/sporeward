# Design

## Context

See [proposal.md](proposal.md) for motivation. `outbreak-visuals` already owns the accepted behavior: outing contact adds a green check while preserving the underlying lifecycle information.

The shared `guideState` helper in `packages/rendering/src/outbreak-guide.ts` returns `visited` before evaluating the outbreak lifecycle. `FieldLabLayers.tsx` and `AreaSummaryLayer.tsx` use that result as the single badge icon, while `RicherMapImages.tsx` also uses it to select detailed material colors. `RouteMap.tsx` adds a teal contact outline. This means the contact state can replace lifecycle color and badge information at both individual overview and detailed zoom.

## Goals / Non-Goals

**Goals:**

- Keep lifecycle state and current-outing contact as separate composition inputs.
- Preserve lifecycle color and badge information while retaining a clearly visible contact check at detailed and individual overview zoom.
- Keep the composition native and camera-aligned, with bounded marker assets/layers.

**Non-Goals:**

- Change which contacts are detected, cooldowns, points, rewards, grouping, or lifecycle rules.
- Change the shared accepted capability contract or add a new visual vocabulary.
- Rework grouped area summaries where individual destinations are intentionally collapsed.

## Decisions

1. **Represent lifecycle and contact independently.** Compute the lifecycle badge and effort palette without using the `visited` flag as a replacement state. Carry the outing-contact flag separately, then compose its check as an additive marker treatment that leaves the lifecycle glyph visibly identifiable. This addresses both the overview badge data in `AreaSummaryLayer` and the detailed badge/material inputs in `FieldLabLayers` and `RicherMapImages`. Reusing the single `visited` state would keep producing the observed information loss.

2. **Keep composition in the existing MapLibre camera pipeline.** Use native symbol/image/layer composition at the outbreak's existing geographic anchor and keep the current MapLibre press targets. Avoid adding a screen-space overlay or per-frame React Native drawing; those would duplicate camera transforms and introduce extra update work.

3. **Test the composition boundary, then review the real emulator rendering.** Add a focused mobile test around the feature/badge composition for representative lifecycle states with contact both absent and present, at overview and detailed marker modes. Automated assertions should verify lifecycle identity and contact indication are both present; they cannot establish readability, so emulator visual acceptance remains a separate owner gate.

## Risks / Trade-offs

- [Risk] A combined badge may make either the lifecycle glyph or check hard to read at overview scale → [Mitigation] Cover the smallest individual overview marker in emulator review and adjust native symbol composition while keeping both signals legible.
- [Risk] Splitting state inputs may accidentally alter effort colors or personal contact styling → [Mitigation] Include active, withering, clearing, remnant, and unavailable/cooldown fixtures in focused composition coverage.
- [Risk] Additional badge assets or layers could increase native map work → [Mitigation] Keep the asset set bounded by existing lifecycle states, reuse existing feature collections, and avoid per-frame generation.

## Migration Plan

No data or API migration. Rollback consists of reverting the mobile composition and its focused tests; historical contact geometry, saved outings, rewards, and field-world state remain untouched.

## Open Questions

The final small-marker balance and whether the check is drawn within or immediately beside the lifecycle glyph are visual decisions for the emulator owner-acceptance review; both must leave the lifecycle state readable.
