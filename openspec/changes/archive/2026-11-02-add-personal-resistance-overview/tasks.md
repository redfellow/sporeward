# Tasks

## 1. Model personal overview evidence

- [x] 1.1 Add a pure overview model/copy using received Resistance context and existing lab summaries; verify focused synthetic tests cover positive/empty/missing fields, no global penalty or recovery countdown, no guaranteed future points, matching versus stale outing offers, provisional versus confirmed collection, lab removal/expiry, direct-distance ordering and missing/stale location. Document presentation assumptions in the design.
  - proof: `npx vitest run apps/mobile/src/components/resistance-overview.test.ts`
  - proof: `npm run typecheck --workspace @sporeward/mobile`
- [x] 1.2 Expose narrowly scoped structured snapshot/provenance status through the existing world hook for the overview; verify focused transition tests cover first load, attributable last-known data after failure, unknown legacy-cache provenance, owner/server/world resets and late async responses without another poller, cache rewrite or recorder changes. Record the actual cache/identity boundary in the design.
  - proof: `npx vitest run apps/mobile/src/server/world-provenance.test.ts`
  - proof: `npx vitest run tests/mobile-world-auth.test.ts`

## 2. Add the map overview and lab flow

- [x] 2.1 Add the bounded Resistance sheet and live-map entry point with established/empty/unavailable/last-known states, loaded-world lab candidates and short recovery copy; verify mobile TypeScript and source/component checks cover idle, recording and paused presentation, virtualized candidates and the absence of historical-map UI. Add concise player-rules guidance and verify its local links.
  - proof: `npx vitest run tests/mobile-resistance-overview-sheet.test.ts`
  - proof: `npm run typecheck --workspace @sporeward/mobile`
- [x] 2.2 Wire Show affected area and lab selection through the existing native camera and destination flow, coordinating Nearby, Recent contacts, details, compact pin and notices; verify focused bounds/selection tests and scoped navigation checks cover invisible-field disabling, stale target selection, pin preservation, Back-first dismissal, notice suppression and accessible pause/finish. Record that source checks do not prove physical layout acceptance.
  - proof: `npx vitest run tests/mobile-resistance-overview-navigation.test.ts`
  - proof: `npm run typecheck --workspace @sporeward/mobile`

## 3. Review and accept the slice


## Manual checks after merge (Reijo)

No agent could do these from its sandbox; Reijo does them once the pull request is merged.

- Obtain independent implementation review and resolve blocking findings; pass strict OpenSpec validation, `git diff --check` and Android JavaScript export, then record exact check scope, Git/dependency disposition and remaining phone gate in the handoff. Do not substitute full-suite or emulator startup for focused checks.
- Obtain owner phone acceptance on narrow/wide layouts: understandable personal state and spatial-summary copy, affected-area focus, lab detail/pin flow, offline wording, Close/Back, notice coordination and reachable pause/finish during recording. Keep this separate from automated checks, outdoor GPS reliability and earlier features' acceptance tasks.

## Workflow follow-up

- Planning only until the owner reviews the artifacts and requests apply. Begin implementation on its own feature branch from current merged main; do not attach it to an earlier PR.
- Prefer synthetic fixtures and focused checks, with no required new outing or emulator session. Phone acceptance can be scheduled separately but stays pending until performed.
- Commit, push and PR creation require separate authorization. Baseline sync/archive follow independent review and required owner acceptance; preserve existing phone gates and unrelated artwork.
