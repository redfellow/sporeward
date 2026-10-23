# Design

## Context

See [proposal.md](proposal.md) for the issue and scope. On the current main baseline, `OutingRecap.tsx` formats `lab.actualFraction` inline with `Math.round(... * 100)` and always renders “Your resistance was reduced everywhere.” for a confirmed result. `LabCollectionResult` already provides both `actualFraction` and `resistanceReduction`; no Field Lab feedback helper exists. The accepted contract is [Understandable expedition benefit](../../../openspec/specs/renewable-exploration/spec.md#requirement-understandable-expedition-benefit).

## Goals / Non-Goals

**Goals:**

- Make the displayed percentage and explanatory copy reflect the confirmed collection result.
- Explain that lower resistance can benefit later eligible familiar-area visits only when the collection reduced resistance.

**Non-Goals:**

- Change server calculations, persisted Resistance, recap payloads, benefit wording, or any accepted gameplay rule.
- Change map rendering, camera behavior, or field-world state.

## Decisions

- Add a small pure formatter in `apps/mobile/src/components/outing-recap-format.ts` and cover it with `apps/mobile/src/components/outing-recap-format.test.ts`, following the existing mobile Vitest test pattern. Do not depend on a pre-existing feedback helper.
- Format from `actualFraction`: when it is positive but `Math.round(actualFraction * 100)` is zero, show `<1% restoration`; otherwise keep the current rounded whole-percent label, including `0%`.
- Select explanatory copy independently from `resistanceReduction`. For a positive reduction, explain the possible reduction in resistance-based point loss on later eligible familiar-area visits. For zero, say no resistance was restored in this collection. Preserve the existing limited-result and reconciled-upload details.
- Test positive sub-percent, positive whole-percent, and zero outcomes; assert that zero reduction never receives the positive-benefit copy.

## Risks / Trade-offs

- [Risk] `actualFraction` and `resistanceReduction` express different parts of the result and malformed data could make them differ → [Mitigation] Use each field only for its defined display purpose: fraction for the percentage and reduction for the explanatory copy; cover zero reduction explicitly without adding fallback business logic.

## Migration Plan

No data or server migration is needed. Apply the recap formatter and focused regression tests; rollback is a local UI formatter revert.
