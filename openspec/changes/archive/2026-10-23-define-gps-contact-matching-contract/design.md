# Design

## Context

See proposal.md for motivation. `packages/game/src/contacts.ts` is shared by the local recorder preview and authoritative server path. It uses a 10 metre tolerance and time-bounded footprint rings. Fix accuracy is retained in activity data but is not part of the shared matching input. The server obtains older footprint intervals from the PostGIS archive when processing eligible delayed activities.

## Goals / Non-Goals

**Goals:**

- Record the owner-confirmed geometric contact rules and existing historical footprint selection as a durable capability.
- Align the GPS contact passage in `docs/game-concept.md` with the contract.
- Preserve recorded fixes, footprint history, field accounts, and current scoring state.

**Non-Goals:**

- Changing runtime matching, activity storage, server settlement, or map rendering.
- Defining duplicate-source reconciliation or historical award/leaderboard policy.
- Defining peer-visible location precision, live sharing, or protection-area behavior.

## Decisions

- Use the existing shared matcher as the behavioral baseline: a directly observed fix qualifies inside the footprint or within 10 metres of its boundary; inferred crossings are limited to consecutive fixes in the same segment no more than 2 seconds apart.
- Keep fix accuracy informational. Do not filter contacts or expand the geometric boundary based on the reported accuracy value, and do not introduce an accuracy threshold.
- Select historical geometry by its half-open validity interval at the recorded contact timestamp. Preserve archived footprint versions so delayed eligible activities can be matched against the geometry that existed then.
- Treat this as a documentation and capability-baseline change. Runtime code and Android's map pipeline remain untouched; no field data migration is required.

## Risks / Trade-offs

- [Low-quality GPS can still establish a contact when its recorded coordinate meets the geometric rule] → The owner explicitly chose informational-only accuracy for this MVP; any later accuracy policy requires a separate decision and change.
- [The game concept currently suggests accuracy may influence in-app matching] → Align that passage with the confirmed contract while leaving unrelated location privacy questions open.
- [Geometry matching does not settle late rewards or duplicate activity sources] → Keep those rules outside this capability and retain their open status.
