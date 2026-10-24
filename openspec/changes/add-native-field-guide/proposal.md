# Proposal

## Why

Testers can see outbreaks, Field Labs and Resistance on the phone but cannot learn their meaning inside the app. The owner accepted an offline visual field guide as the next player-facing feature after outing history on 24 October 2026.

## What Changes

- Open a native field guide directly from the map and return with its close control or Android back.
- Lead with a short outing/rewards overview; follow with the approved Ember & violet outbreak specimens and concise explanations.
- Explain available/collected Field Labs and personal Resistance with the accepted station artwork and blue-violet field.
- Keep the guide bundled and read-only, including while recording, without changing activity, world or account state.
- Identify preview-only splitting/cracking separately from the current ordinary-world rules.

## Capabilities

### New Capabilities

- `native-field-guide`: Offline in-app learning, entry/return navigation, specimen presentation and honest reward explanations.

### Modified Capabilities

None; reuse existing artwork and gameplay contracts without changing them.

## Impact

React Native guide components and map navigation; reuse `packages/rendering` shapes, pigments, badges and survey station recipe. No service changes, new dependencies, gameplay changes or deployment are required. Sources: [player rules](../../../docs/player-rules.md), [outbreak visuals](../../specs/outbreak-visuals/spec.md), [Field Labs](../../specs/field-labs/spec.md), and [Resistance](../../specs/outbreak-resistance/spec.md).
