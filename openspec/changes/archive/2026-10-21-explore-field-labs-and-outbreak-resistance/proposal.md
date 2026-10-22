# Proposal

## Why

Sporeward should first encourage worthwhile A-to-B cycling detours and discovery, then additional outings, with scores and competition supporting those goals. Renewable local opportunities should avoid tile hunting's permanently receding frontier; a desktop visual study will make the proposed personal resistance and shared expedition reward understandable before gameplay implementation.

## What Changes

- Extend the existing desktop visual guide with Field Labs: fictional survey stations, available and personally collected states, and a playful collection reward pool.
- Preview personal Outbreak Resistance as a circle strongest at its centre and fading outward, including passive recovery and visible weakening on restoration.
- Demonstrate distance-scaled, capped restoration and diminishing successive collection benefits using explicitly illustrative controls and values.
- Preserve the exploration's agreed gameplay direction and unresolved balancing in design.md; these are future requirements, not authorization to implement a resistance engine or field deployment.

## Capabilities

### New Capabilities

- `field-lab-guide`: Desktop presentation of shared Field Labs, personal collection status, reward names and simulated restoration.
- `outbreak-resistance-guide`: Desktop presentation of personal geographic resistance, recovery and advertised restoration effects.

### Modified Capabilities

None. The existing pending `outbreak-visuals` and `visual-showcase` capabilities remain owned by [the Android visual-port change](../../replicate-approved-visuals-and-showcase/proposal.md).

## Impact

Expected implementation touches the web `PaletteStudy` guide and its styles, with reusable platform-neutral visual definitions where appropriate. Preserve the accepted ordinary-outbreak reference at `754a5c1`. No server, scoring, account, historical geometry, field-world, Android or deployment changes are included. Existing rules remain in [game-concept.md](../../../../docs/game-concept.md) and [player-rules.md](../../../../docs/player-rules.md); update those only in a later gameplay change when its mechanics are specified. Do not replace the current-goal pointer or expand the existing visual-port checklist in this change.
