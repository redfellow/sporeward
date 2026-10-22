# Design and handoff

## Context

See [proposal.md](proposal.md). This document preserves the project-wide exploration independently of chat retention. It is a documentation plan, not a claim that its tasks or the linked feature changes are complete. Concurrent agents own feature implementation; re-read their artifacts when resuming instead of relying on task counts recorded in conversation.

## Goals / Non-Goals

**Goals:** One durable product direction, evidence-based status, a searchable question inventory and clear resumption links.

**Non-Goals:** New gameplay rules, feature implementation, a full product audit, inventing achievement requirements, or reopening settled decisions. No field data or Android runtime changes.

## Confirmed product decisions

1. First priority: make cycling from A to B a little longer because a detour is worthwhile, sometimes reaching places the player has not visited.
2. Second priority: motivate an outing that otherwise would not happen.
3. Third priority: increasing scores and competition. Achievements interest the owner, who has ideas; no achievement system has been specified.
4. Exploration must be renewable. Avoid permanent tile exhaustion that pushes all rewarding destinations farther away. Familiar routes and a thirty-minute local walk should remain useful.
5. A weekly work/commute rhythm matters. Weekend adventures should earn meaningful additional benefit, without making long excursions mandatory maintenance for local play.
6. Shared destinations support co-op; one rider must not consume another's opportunity. Specific Field Lab rules now belong to the gameplay change below.

## Project-level findings and proposed evaluation

- Source and completion evidence include accounts, PostGIS persistence, geographic lifecycle and reusable recorded-GPS simulation. README, architecture and roadmap still describe parts as absent/future. Reconcile each claim against current source/tests and evidence rather than treating this observation as a comprehensive live audit.
- Distinguish implemented behaviour, approved design, proposed defaults, technical verification and owner/field acceptance. Emulator success does not establish outdoor GPS reliability or public-launch readiness.
- The visual plan closes a communication gap: the world model is richer than its current Android presentation. A complete visual showcase proves state readability, not that the game creates satisfying detours.
- Proposed product evaluation: an ordinary A-to-B journey with several plausible choices, inspecting whether the player can identify an attractive detour, judge extra distance/reward, understand the crossing's contribution and want to return. No route planner or automatic routing feature was agreed.
- Evaluate the loop: see opportunity -> choose route -> cross targets -> understand result -> see world change -> return. This is an evaluation lens, not a mandated new UI flow.
- Discovery is an intended outcome, not necessarily a permanent exploration score. A separate persistent exploration record was suggested early but was not adopted. Do not turn that suggestion into an approved feature.

## Work ownership and resumption map

| Topic | Durable owner / next entry point |
|---|---|
| Field Lab and resistance desktop preview | [Visual study tasks](../archive/2026-10-21-explore-field-labs-and-outbreak-resistance/tasks.md); independently progressing elsewhere |
| Resistance, combined rewards and authoritative labs | [Gameplay tasks](../implement-outbreak-resistance-and-field-labs/tasks.md), [design](../implement-outbreak-resistance-and-field-labs/design.md) and capability specs; independently progressing elsewhere |
| Shared outbreak rendering, Android port and isolated showcase | [Visual-port tasks](../replicate-approved-visuals-and-showcase/tasks.md); preserve emulator/phone approval gates |
| Size/category and strategic splitting mechanics | [Game concept](../../../docs/game-concept.md), especially effort/size and cleaning/splitting; needs its own scoped proposal before implementation |
| Project direction, stale status and remaining-question handoff | This change's [tasks](tasks.md) |
| Other prior unresolved product topics | [Game concept](../../../docs/game-concept.md), [roadmap](../../../docs/development-roadmap.md) and linked evidence; not newly approved by this conversation |

This table is an index, not a prescribed implementation order or a duplicate checklist. Coordinate overlapping renderer/mobile work between the owning changes.

## Remaining questions and deferred work

### Project-wide questions to retain

- **Achievements:** What experiences should they reward, and how should they avoid permanent geographic exhaustion? The owner has ideas that were not described in this conversation; retrieve those from the owner when this feature is explored. Do not invent them or claim to have saved unseen ideas.
- **Route-choice validation:** Which representative A-to-B rides and observable outcomes would demonstrate a worthwhile detour? Define a small test protocol; no numerical success threshold is agreed.
- **Outing motivation:** What makes someone return when no commute is planned? Evaluate current world/reward feedback before proposing another feature.
- **Reward comprehension:** Can a player distinguish visit points, committed cleaning, gradual shrinkage, potential cleanup bonuses and personal eligibility? Assess through the existing guide/map/recap, not visual appearance alone.
- **Scope sequencing:** When should size/category and strategic splitting become their own gameplay change relative to visual integration and field validation? No order was agreed here.
- **Evidence reconciliation:** Which implementation claims and remaining field gates are current? Inspect source and completion evidence before updating overview documents; do not erase real-device/group acceptance gaps.

### Feature questions already owned elsewhere

Resistance centre calculation, history horizon, radius/falloff, point curve/repeat reconciliation, passive decay, soft threshold and floor, restoration distance/cap, diminishing-collection recovery, placement/lifetime, offline offers and late settlement belong to the [gameplay design](../implement-outbreak-resistance-and-field-labs/design.md). Its provisional defaults must not be presented as user-confirmed answers. Use the live artifact for the latest status; do not duplicate its evolving parameter list here.

Size/category thresholds, child-category constraints, split inheritance/conservation, corridor detection and normal-play reachability belong to the concept and a future splitting change. A convincing splitting illustration is not evidence that the player-driven mechanic is complete.

### Alternatives not selected

Longer hard cooldowns, permanent exploration-credit incentives, ordinary distant riding as a separate active restoration source, restoration targeted only at one fatigued neighbourhood, hidden personal labs, expiring restoration buffs and stockpiled restoration were discussed but are not the selected direction. Use the current gameplay specs as authoritative for the chosen lab/resistance model. These alternatives need no implementation tasks unless deliberately reopened.

## Documentation approach

Create a concise `docs/product-direction.md` for priorities, evaluation and a question index. Link it from the concept and roadmap; keep detailed rules and implementation tasks in their existing owners. Update stale overview paragraphs individually with evidence. Keep `docs/current-goal.md` an index and preserve edits from parallel work. Questions can remain explicitly deferred; closing a chat does not require resolving every product decision.

## Risks / Trade-offs

- Duplicated rules drift -> use ownership links; only project-level decisions live in the direction document.
- Planning artifacts get mistaken for shipped behaviour -> label status and cite implementation/acceptance evidence separately.
- A handoff claims to cover unseen chats -> this capture covers the conversation available here; each other active session should record any additional decisions/questions before closing.
- Concurrent edits conflict -> change only this planning directory during capture; coordinate later documentation edits against the working tree.

## Migration Plan

No runtime migration. Apply documentation work when ready; no build, device install or deployment is required. Preserve source/field state and Android performance by making no runtime changes. Before ending other sessions, have their agents update their own task status, unresolved questions and next verification in durable artifacts. Files are saved locally but not automatically committed or backed up by this capture.
