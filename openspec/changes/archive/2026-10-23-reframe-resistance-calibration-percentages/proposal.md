# Proposal

## Why

The canonical resistance requirements currently treat an illustrative four-week reward percentage as a balancing target, and the calibration report says that target was met. That wording can turn scenario-specific examples into product or acceptance criteria, contrary to the owner's clarification.

## What Changes

- Remove fixed week-by-week percentage targets from the resistance balancing requirements.
- State that deterministic calibration percentages describe only the documented scenario inputs and are not product targets or acceptance thresholds.
- Preserve the current versioned resistance curve and 25% code floor as provisional implementation facts; do not retune code or runtime behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outbreak-resistance`: clarify that published percentage results are scenario measurements and not product or acceptance targets.

## Impact

Update the canonical resistance spec and `docs/resistance-calibration.md`. No runtime, API, archive-lane artifact, or test changes are in scope.
