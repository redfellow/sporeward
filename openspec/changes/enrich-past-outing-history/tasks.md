# Tasks

## 1. Serve historical contact geometry

- [x] 1.1 Return historical footprints valid at each saved encounter time for only the authenticated player's processed activity; verify matching intervals and cross-account 404 behavior in focused server tests.
- [x] 1.2 Add and validate the shared footprint response contract and mobile fetch; verify malformed geometry and mismatched activity IDs are rejected.

## 2. Load and present outing summaries

- [x] 2.1 Derive GPS distance, active duration excluding pauses, upload state, and saved authoritative points for the account-scoped eight-outing window; verify the mobile TypeScript check passes and provisional points are labeled separately.
- [x] 2.2 Show outing cards with a compact heatmap route thumbnail, historical touched outbreaks when available, and corner score badges; verify each preview is tied to its own route, contacts, and recap.
- [x] 2.3 Use the same full-screen map recap after finishing and from outing history, with A-to-B route heatmap, historical touched-outbreak shapes, and corner score badges; verify the mobile TypeScript check passes.
- [ ] 2.4 Confirm on Android that back from a history recap returns to the outing list.

## 3. Review the user-facing result

- [ ] 3.1 Check empty, pending-upload, uploaded-with-recap, and uploaded-without-recap states on Android; confirm cards remain account-scoped, score badges distinguish pending values, historical footprints match contacts, and scrolling remains responsive.

The owner deferred tasks 2.4 and 3.1 to a later physical-phone session on 24 October 2026. They remain open and do not block publishing the implementation PR or starting the next feature.
