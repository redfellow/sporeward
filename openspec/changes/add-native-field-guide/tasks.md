# Tasks

## 1. Bundle guide content and accepted specimens

- [x] 1.1 Add concise native guide copy and local outbreak/station/resistance specimens built from shared artwork; verify deterministic specimen output, valid geometry and no remote asset references with focused rendering checks.
  - proof: `npx vitest run packages/rendering/src/guide-specimen.test.ts packages/rendering/src/outbreak-guide.test.ts`

## 2. Present the native guide

- [x] 2.1 Add the short introduction, virtualized visual gallery and Field Lab/Resistance section with optional single-specimen motion; verify the mobile TypeScript check and a JavaScript bundle build pass.
  - proof: `npm run typecheck --workspace @sporeward/mobile`
  - proof: `D=$(mktemp -d) && HOME=$D EXPO_NO_TELEMETRY=1 CI=1 npm exec --workspace @sporeward/mobile -- expo export --platform android --output-dir $D/out`
- [x] 2.2 Add a direct map entry and Android back/close return without recorder actions; document the entry in player rules and verify navigation wiring by independent code review.
  - proof: `grep -E "setGuideOpen\(true\)" apps/mobile/App.tsx`
  - proof: `grep -E "BackHandler.addEventListener" apps/mobile/src/components/FieldGuide.tsx`
  - proof: `grep -E "Field guide" docs/player-rules.md`

## 3. Review the delivered slice

- [x] 3.1 Obtain independent review against this accepted scope, address blocking findings, and pass strict OpenSpec validation and `git diff --check`.
  - proof: `openspec validate add-native-field-guide --strict`
  - proof: `git diff --check`

## Manual checks after merge (The user)

No agent could do these from its sandbox; the user does them once the pull request is merged.

- Have the owner inspect the guide on a physical phone, including back navigation, readability and reduced motion. Keep this later acceptance separate from implementation checks.

## Workflow follow-up

- Owner approved implementation of the proposed map-entry/accepted-specimens/lab-and-resistance guide in chat on 24 October 2026.
- Phone visual testing is deferred at the owner's request; do not require emulator startup to implement this slice or mark phone acceptance complete.
