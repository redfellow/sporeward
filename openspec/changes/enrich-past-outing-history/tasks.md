# Tasks

## 1. Serve historical contact geometry

- [x] 1.1 Return historical footprints valid at each saved encounter time for only the authenticated player's processed activity; verify matching intervals and cross-account 404 behavior in focused server tests.
  - proof: `npx vitest run apps/server/src/world-store.test.ts`
  - proof: `npm run typecheck --workspace @sporeward/server`
- [x] 1.2 Add and validate the shared footprint response contract and mobile fetch; verify malformed geometry and mismatched activity IDs are rejected.
  - proof: `npx vitest run packages/protocol/src/activities.test.ts`
  - proof: `npm run typecheck --workspace @sporeward/protocol`

## 2. Load and present outing summaries

- [x] 2.1 Derive GPS distance, active duration excluding pauses, upload state, and saved authoritative points for the account-scoped eight-outing window; verify the mobile TypeScript check passes and provisional points are labeled separately.
  - proof: `npm run typecheck --workspace @sporeward/mobile`
- [x] 2.2 Show outing cards with a compact heatmap route thumbnail, historical touched outbreaks when available, and corner score badges; verify each preview is tied to its own route, contacts, and recap.
  - proof: `npx vitest run apps/mobile/src/components/outing-thumbnail-model.test.ts`
  - proof: `npm run typecheck --workspace @sporeward/mobile`
- [x] 2.3 Use the same full-screen map recap after finishing and from outing history, with A-to-B route heatmap, historical touched-outbreak shapes, and corner score badges; verify the mobile TypeScript check passes.
  - proof: `npx vitest run apps/mobile/src/components/outing-recap-format.test.ts`
  - proof: `npm run typecheck --workspace @sporeward/mobile`

## Manual checks after merge (The user)

No agent could do these from its sandbox; the user does them once the pull request is merged, in a physical-phone session. They do not block publishing the implementation PR or starting the next feature.

- Confirm on Android that back from a history recap returns to the outing list.
- Check empty, pending-upload, uploaded-with-recap, and uploaded-without-recap states on Android; confirm cards remain account-scoped, score badges distinguish pending values, historical footprints match contacts, and scrolling remains responsive.
