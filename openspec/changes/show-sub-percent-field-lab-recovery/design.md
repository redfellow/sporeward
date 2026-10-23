# Design

## Context

See [proposal.md](proposal.md) for the issue and scope. The recap currently formats `lab.actualFraction` inline with `Math.round(... * 100)`, while confirmed positive-benefit copy is produced from `resistanceReduction` by the existing [Field Lab feedback helper](../../../apps/mobile/src/recording/field-lab-feedback.ts). The accepted contract is [Understandable expedition benefit](../../../openspec/specs/renewable-exploration/spec.md#requirement-understandable-expedition-benefit).

## Goals / Non-Goals

**Goals:**

- Make the displayed percent truthful for a positive reduction that would otherwise round to zero.
- Keep the existing positive/zero benefit rule and test the display boundary directly.

**Non-Goals:**

- Change server calculations, persisted Resistance, recap payloads, benefit wording, or any accepted gameplay rule.
- Change map rendering, camera behavior, or field-world state.

## Decisions

- Use the actual reduction fraction already present in the confirmed recap result. When it is positive and its rounded whole percent is zero, format it as `<1% restoration`; otherwise retain the current whole-percent label, including `0%` when no Resistance was removed. This keeps the label tied to actual restoration without inventing precision. An alternative is to display extra decimal places, but that adds apparent precision the accepted contract does not require.
- Keep formatting in a small pure function that can be tested alongside the existing recap feedback helper, or an equivalent isolated formatter. Cover a positive value below the whole-percent rounding boundary, a positive value that rounds to a nonzero percent, and zero. Assert the positive-benefit case never renders `0%`.
- Leave the feedback helper's benefit claim conditioned on positive `resistanceReduction`; the fix is limited to making the separate percentage label consistent with that claim.

## Risks / Trade-offs

- [Risk] `actualFraction` and `resistanceReduction` could be inconsistent in malformed recap data → [Mitigation] Keep this correction to formatting the provided actual fraction and test the intended matching positive case; do not add fallback business logic or alter the contract.

## Migration Plan

No data or server migration is needed. Apply the recap formatter and focused regression tests; rollback is a local UI formatter revert.
