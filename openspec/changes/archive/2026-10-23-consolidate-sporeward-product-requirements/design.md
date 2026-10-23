# Design

## Context

See [proposal.md](proposal.md) for motivation and scope. This design records the initial cross-reference and a staged approach for turning it into a durable product contract.
The statement-by-statement evidence and disposition ledger is in [traceability.md](traceability.md). It separates product decisions, implementation, verification and acceptance scope.

The game idea presently visible across [game-concept.md](../../../docs/game-concept.md), [player-rules.md](../../../docs/player-rules.md), [product-direction.md](../../../docs/product-direction.md), and the archived product-direction work has a clear player priority: make an A-to-B outing more worthwhile through optional detours; motivate outings that otherwise would not happen; then support score growth and competition. Exploration must stay renewable so familiar routes and short local outings remain worthwhile. Achievements are an interest, not a specified feature.

The intended loop can be expressed as:

```text
Choose an outing and inspect opportunities
        ↓
Record a human-powered route and touch targets
        ↓
Validate timed contacts and award eligible personal points
        ↓
Apply cleaning to a shared world and explain pending rewards
        ↓
See a changed, replenishing world and choose a future outing
```

The evidence trail is split across Android recording (`apps/mobile/src/recording/` and `apps/mobile/App.tsx`), shared contact/scoring rules (`packages/game/src/contacts.ts`, `packages/game/src/engine.ts`), authoritative world and persistence (`apps/server/src/world-store.ts`, `apps/server/src/app.ts`, `apps/server/src/database/`), Field Labs/resistance (`apps/server/src/field-labs.ts`, `apps/server/src/resistance-state.ts`), rendering (`packages/rendering/`, `apps/mobile/src/components/`), and reusable replay (`apps/server/src/replay/`, `docs/replay-tool.md`). `apps/web/src/main.tsx` currently exposes rendering studies and says the playable map is coming next. This is a trace sample, not a complete code audit.

`packages/game` owns deterministic rule transitions and is imported by the server world store; it is not a complete GPS or geographic engine by itself. Geographic footprints and historical contact matching live in the server. Android has a native recorder, account controls, map, uploads and recaps. The browser entry point is a rendering/exploration study, not the broader browser product described as an intention in the concept. The server has an authenticated named-score endpoint, but the concept's global/country/monthly/yearly leaderboard system is not evidenced. There is no evidenced Strava integration, browser route-planner extension, public production service, or live rider-sharing flow in this checkout. Resistance scoring is available behind explicit server configuration and should be classified as opt-in, not assumed active.

Some gameplay concepts are partly represented but not active in the server world: `packages/game/src/engine.ts` contains seeded split transitions, but `apps/server/src/world-store.ts` initializes and maintains `splitProbability: 0`. Rendering examples are not proof that a mechanic is enabled for ordinary outings.

## Goals / Non-Goals

**Goals:**

- Convert the audit into an owner-reviewable product definition with traceable decisions, behaviors, implementation evidence, acceptance evidence, and open questions.
- Give every enduring behavior one cohesive OpenSpec capability owner, reuse existing Field Labs, resistance and visual capabilities, and avoid a catch-all spec.
- Keep product requirements separate from implementation status, test evidence, field acceptance, operational instructions and historical notes.
- Establish a small, consistent set of documentation roles and a staged cleanup plan.

**Non-Goals:**

- Decide unaccepted gameplay rules or turn every current code behavior into desired product behavior.
- Change code, runtime behavior, APIs, world data, database state, deployments, or visual output.
- Claim that emulator, unit, replay, phone-visual or historical field evidence proves background GPS reliability or group acceptance.
- Reopen the accepted Field Lab/resistance and Android visual baselines without a specifically identified gap.

## Decisions

### 1. Keep an evidence and decision ledger before rewriting prose

For each candidate statement, record its source, disposition, owner, and evidence category:

| Category | Meaning |
| --- | --- |
| Confirmed product intent | Owner-approved experience or rule; safe to express as a normative requirement |
| Provisional design | Candidate mechanic or value awaiting explicit acceptance; stays labeled and does not become a MUST |
| Implemented behavior | Located in current code; does not alone prove it is desired or accepted |
| Verified behavior | Specific test, replay or runtime evidence exists; cite its actual scope |
| Owner/field acceptance | Explicit human/device/group evidence; do not infer from checks passing |
| Deferred or open | A conscious future scope or an unresolved decision with a next owner action |

Rationale: several docs mix these states and contain dated handoff paragraphs. Alternatives are to rewrite from the newest prose or treat archived tasks as current truth; both risk preserving stale status or promoting ideas that were never approved.

### 2. Model requirements around capabilities and the player loop

Owner-approved capability map for this documentation pass (23 October 2026). The map organizes approved behavior; it does not make deferred or open features normative:

1. **Outing and exploration** — `renewable-exploration` owns optional detours, renewable local play and the confirmed lab-recovery experience.
2. **Activity recording and contact validation** — new `activity-recording` owns the native MVP source; `gps-contact-matching` owns contact geometry and timestamp evidence. Eligibility and award rules remain with their existing scoring capability.
3. **Outbreak world and lifecycle** — `outbreak-growth` owns the current provisional lifecycle; `outbreak-visuals` owns the accepted presentation. Strategic splitting remains deferred and is not activated by these specs.
4. **Scoring and rewards** — `visit-scoring` owns legacy repeat-point behavior; reuse `field-labs` and `outbreak-resistance` for accepted rewards and recovery. Do not duplicate those rules in other capabilities.
5. **Identity, sharing and privacy** — new `account-owned-play` records accepted account attribution. Live presence, visibility controls and protection areas remain open and have no normative requirements in this pass.
6. **Player feedback and presentation** — new `outing-feedback` owns confirmed-versus-conditional outing results; reuse `outbreak-visuals` and `visual-showcase` for map presentation and visual review.
7. **Integrations and competition** — Strava, multi-source outing grouping, expanded rankings and route-planner integration remain deferred or open; no normative requirements are added.

Replay harnesses, emulator setup, tester onboarding, field migration and deployment procedures remain engineering/operations documentation, not player-facing product capabilities.

Rationale: the existing docs group by authoring history and project stage, while code ownership is distributed by service. Capability-sized contracts let product requirements stay stable when the implementation moves. Alternatives are one giant `sporeward` spec or one spec per document; either would blur ownership and create repeated rules.

### 3. Use a documentation ownership map, not parallel summaries

- `openspec/specs/` becomes the accepted behavior baseline; active change artifacts own proposed behavior and acceptance for a scoped change.
- `docs/game-concept.md` becomes a concise product framing and design rationale page, with unresolved ideas linked to their requirement owner rather than restating every rule.
- `docs/player-rules.md` remains a concise player-facing guide generated/reconciled from accepted, implemented behavior; it must not promise deferred features.
- `docs/product-direction.md` retains the three priorities and evaluation ideas; unresolved MVP decisions stay with their owning OpenSpec change rather than being repeated in a project-wide question inventory.
- A sparse `docs/future-ideas.md` holds deferred product ideas in non-normative form. It is a source for later exploration, not an acceptance list or a roadmap; an idea moves into requirements only through a separately scoped, reviewed change.
- `docs/development-roadmap.md` retains outcome gates and current/future stage sequencing, with current state pointing to evidence rather than copying detailed requirement lists.
- `docs/finished-goals.md` stays a dated historical evidence ledger; do not rewrite history or use old “remaining work” sentences as a current checklist.
- `docs/architecture.md` stays technical responsibility and deployment-boundary documentation.
- Setup, replay, tester account, field migration and rendering evidence documents remain only when they provide actionable procedures or unique evidence; remove duplicated status narration and repair links.

Initial document dispositions for the full audit:

| Documents | Proposed role after cleanup |
| --- | --- |
| `docs/game-concept.md`, `docs/product-direction.md` | Product promise, priority order, design rationale and evaluation; point normative behavior to capability specs |
| `docs/future-ideas.md` | New sparse, non-normative holding page for post-MVP goals; pull an idea into a later proposal when prioritized |
| `docs/player-rules.md` | Concise player guide, limited to behavior approved and actually available in the described product slice |
| `docs/development-roadmap.md` | Outcome gates and sequencing; remove copied acceptance lists and revalidate every “immediate next work” item |
| `docs/architecture.md`, `docs/development-setup.md` | Keep as current technical boundary and setup procedure |
| `docs/finished-goals.md`, `docs/field-tests/` | Preserve dated evidence and limitations; do not turn historical “remaining” notes into live task state |
| `docs/replay-tool.md`, `docs/tester-accounts.md`, `docs/field-migration.md` | Keep unique operator steps; refresh stale prerequisites and remove duplicated project-status paragraphs |
| `docs/field-labs-integration.md`, `docs/resistance-integration.md`, `docs/resistance-calibration.md` | Keep unique implementation/calibration details linked from their capability owners; clearly label provisional values and obsolete status snapshots |
| `docs/native-outbreak-rendering.md`, `docs/native-richer-rendering.md`, `docs/rendering-prototype.md`, `docs/exploration-labs-preview.md`, `docs/visualizations/` | Retain useful visual/evidence references, but label experiments and superseded studies; resolve review-state titles and links |
| `docs/spatial-test-world.md`, `docs/first-outbreak-encounter.md` | Keep spatial/field procedures and limitations; separate current field gates from completed dated deployment or replay evidence |
| `docs/tilehunting.md`, `docs/images/` | Keep as background and supporting artwork, outside normative product requirements |

Rationale: deleting all docs would lose useful operations and history; keeping every overview unchanged would preserve drift. A role map provides a testable target for selective condensation.

### 4. Preserve state and platform guarantees during documentation-only work

The plan has no runtime or data migration. It must not touch PostGIS snapshots, activity storage, tester accounts, precise GPS files, server environment or APKs. It must also leave Android map/rendering code and its MapLibre camera pipeline untouched; the accepted visual baseline and performance constraints remain linked evidence, not a request for another rendering pass.

If a later implementation is proposed, it needs its own scoped change and explicit data/performance design. Alternatives such as folding this documentation pass into a feature implementation are rejected because they would make status, acceptance and data risks harder to review.

### 5. Resolve blocking product decisions before authoring normative specs

Initial cross-reference flags candidate decisions that should remain open until traced and, where needed, answered by the owner: A-to-B evaluation routes and success observations; achievements; final size/category and splitting behavior; accuracy limits and privacy boundaries; late/offline reward settlement; outing matching across sources; live sharing; Strava behavior; leaderboard scope and settlement; browser product scope; and production launch boundaries. Candidate values in `game-concept.md`, calibration notes and archived changes remain provisional unless their specific acceptance is recorded.

Do not put unanswered choices into OpenSpec requirement language. The first owner review should confirm the product spine and whether the capability map has the right boundaries; subsequent discussion can resolve blocking questions in dependency order.

## Initial reconciliation findings

These examples demonstrate the method and should be rechecked during the complete audit:

| Documentation claim | Current evidence | Disposition |
| --- | --- | --- |
| `game-concept.md` says the repository has only an initial scaffold and no playable product | `README.md`, `apps/mobile/App.tsx`, server routes and the finished-goals record describe a functioning Android/test-server/replay slice | Stale; replace with a scoped implemented-versus-unvalidated summary |
| `docs/native-richer-rendering.md` is titled “review pending” | `docs/finished-goals.md` records later Android phone visual acceptance; the visual showcase change is archived | Title/status needs resolution against exact accepted revision |
| `docs/tester-accounts.md` and `docs/spatial-test-world.md` say an active goal still owns completed emulator/account/world checks | OpenSpec has no active change; later dated evidence records many of those checks | Refresh status but preserve genuinely outstanding field/group gates |
| Roadmap says `packages/game` is a separate planning-only simulation | `apps/server/src/world-store.ts` imports its deterministic scoring/lifecycle rules, while spatial geometry remains server-owned | Clarify the rule engine/geographic-world boundary rather than calling the entire package non-authoritative |
| Concept describes browser play and a route-planner overlay | `apps/web/src/main.tsx` currently launches rendering-study views; no route-planner integration is evidenced | Keep as intended/deferred product scope, not implemented capability |
| Player rules explain strategic splitting as an ordinary mechanic | The pure engine contains a split model, but server worlds force split probability to zero; visual fixtures can show a split state | Label it as modeled/illustrated but not active in the current server world until product and activation are reviewed |
| Player guide says split descendants inherit an “original five-hour” cooldown | `packages/game/src/balance.ts` sets six hours; `packages/game/src/engine.ts` copies visit history to children | Correct the guide to six hours after confirming no separate intended rule exists |
| Player-facing prose describes Strava, combined multi-source outings, location sharing/protection areas, and global or country leaderboards | Replay scripts can read private GPS exports, account-owned server uploads and a named score endpoint exist; matching product integrations, privacy controls and regional/time-period boards are not evidenced | Keep as future intent until their actual capability and privacy requirements are scoped |
| Finished-goals and dated integration notes contain both complete and “remaining” statements | The documents record different evidence dates and scopes | Preserve as history; current status belongs in current change/roadmap references with dated evidence |

## Risks / Trade-offs

- [Risk] Unreviewed concepts become mandatory behavior → [Mitigation] Keep a source/disposition ledger and ask about blocking owner decisions before writing normative specs.
- [Risk] Rewriting from prose misses code paths or misstates acceptance → [Mitigation] Trace each requirement to implementation and to a specific test/replay/device record; identify missing evidence explicitly.
- [Risk] A broad change becomes hard to review → [Mitigation] Use owner-reviewed phases and capability-sized artifacts; keep unresolved feature rules out of the first pass.
- [Risk] Removing status prose loses operational knowledge → [Mitigation] Retain unique procedures and dated completion evidence; remove only duplicated status/history.
- [Risk] Documentation changes are mistaken for product validation → [Mitigation] Make no runtime changes and preserve the distinction between code, automated evidence, emulator/phone review, field reliability and launch readiness.

## Migration Plan

No product/data migration. The planned work changes only OpenSpec and documentation. Review the product spine and capability boundaries first; then author and validate the accepted capability requirements; finally condense/link docs and validate relative links, OpenSpec structure and source/evidence references. Each phase should be reviewable before the next.

## Scope decisions recorded

- The first requirement pass describes only the agreed MVP product contract. Future integrations and other post-MVP goals are collected in the sparse ideas document without scenarios, acceptance criteria or implied commitment.
- No other agents are currently running. The planned documentation pass has no parallel agent edits to preserve; recheck the worktree before each later write phase as normal.
