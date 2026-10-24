# Design

## Context

`OutingRecap` already formats confirmed Field Lab results through a pure helper. Its restoration label and limited/reconciled details are independent of the helper's explanation, so the accepted behavior can be met by changing recap copy and its focused tests. See [proposal.md](proposal.md) and the [renewable-exploration delta](specs/renewable-exploration/spec.md).

## Goals / Non-Goals

**Goals:**
- Make positive and zero confirmed reductions read truthfully and preserve the existing recap branches.

**Non-Goals:**
- Change restoration calculations, scoring, transport data, Field Lab settlement, or map behavior.

## Decisions

- Select explanatory copy from the confirmed `resistanceReduction`: positive values describe a possible later familiar-area point-loss benefit and name the factors affecting future points; zero says that this collection restored no resistance and claims no later benefit.
- Keep restoration percentage formatting and the limited/reconciled suffixes unchanged. Focus tests on both explanation branches, including the no-exact-prediction caveats.

## Risks / Trade-offs

- Copy could imply a guaranteed future score change → use conditional language and explicitly name subsequent contributions, elapsed time, and reward rounding.
- The change has no field-state migration or Android map work; existing collection and recap data remain untouched.
