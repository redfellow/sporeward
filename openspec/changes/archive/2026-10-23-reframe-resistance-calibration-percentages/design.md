# Design

## Context

See `proposal.md` for the clarification. The canonical `outbreak-resistance` spec currently contains four-week and 50% balancing targets. `docs/resistance-calibration.md` reports deterministic synthetic fixtures and includes language saying specific targets were met. The current implementation remains version 1 with a 25% reward floor in `packages/game/src/resistance.ts`.

## Goals / Non-Goals

**Goals:**
- Keep the canonical spec focused on deterministic, scenario-described measurement rather than a fixed percentage acceptance target.
- Make the calibration table and interpretation explicitly descriptive of its fixtures.
- Preserve versioned code behavior and clearly identify its 25% floor as provisional.

**Non-Goals:**
- Change resistance formulas, values, activation, persistence, or runtime behavior.
- Edit archived lane artifacts or add project tests.

## Decisions

- Modify only the existing `outbreak-resistance` requirements for combined rewards and weekly balancing evidence; keep their full scenarios in the delta.
- Retain percentage values in the calibration table as measured outputs, preceded and followed by text stating that they are scenario-specific measurements, not product or acceptance targets.
- Remove statements that a first-week or four-week target was clarified, met, satisfied, or used as the calibration reference. Keep the code's current version and floor unchanged.

## Risks / Trade-offs

- Readers could still infer targets from precise measured percentages. Label the fixture, timing, inputs, and non-acceptance status adjacent to the table and in its interpretation.

## Migration Plan

Sync the delta into the canonical spec and archive this documentation-only change after strict validation. No runtime migration or rollback is needed.
