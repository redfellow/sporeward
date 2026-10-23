# Product direction and open questions

This page records confirmed project priorities, evaluation proposals and questions that still need decisions. Feature rules stay with their owning OpenSpec changes and [game concept](game-concept.md).

## Confirmed priorities

1. Make a ride from A to B a little longer when a worthwhile detour offers a chance to visit somewhere unfamiliar.
2. Motivate an outing that otherwise would not happen.
3. Grow scores and competition. The owner is interested in achievements and has ideas, but no achievement system or requirements have been specified.

Exploration must remain renewable. Do not make permanent tile exhaustion push every rewarding destination farther away. Familiar routes and a thirty-minute local walk should remain worthwhile. A weekly work/commute rhythm matters; weekend adventures should add meaningful benefit without making long rides mandatory maintenance. Shared destinations support co-op: one rider must not consume another rider's opportunity.

These priorities guide evaluation; they do not define additional gameplay rules or numeric targets.

## Confirmed MVP loop

An ordinary A-to-B journey can become a little longer when a reachable outbreak or Field Lab makes an optional detour worthwhile, sometimes toward an unfamiliar place. Familiar rides, commutes and short local walks remain useful; longer outings add benefit without becoming mandatory maintenance.

Weekday cleaning builds personal, spatial Outbreak Resistance, reducing ordinary visit points around regularly cleaned places. A weekend Field Lab hunt reduces accumulated resistance so subsequent familiar outings lose fewer points than equivalent play without that recovery. Several labs can provide greater relief under diminishing returns. This does not promise a full reset, a fixed recovery percentage or a resistance-free following week; later cleaning continues to add resistance.

Recovery is most relevant where the player's contributions are concentrated. Local rewards use distance-weighted contributions, rather than one uniform global resistance meter. The displayed centre summarizes that geography. Cleaning outbreaks along an adventure can gradually shift the centre toward that direction as the concentration changes; following where the player actually plays is desirable.

The [renewable exploration contract](../openspec/specs/renewable-exploration/spec.md) owns this player experience; the [Field Lab contract](../openspec/specs/field-labs/spec.md) and [resistance contract](../openspec/specs/outbreak-resistance/spec.md) own the mechanics. Resistance affects ordinary visit points, while committed cleaning and cleanup bonuses retain their existing rules. The implementation remains configuration-dependent; this product contract does not establish field acceptance.

## Proposed evaluations

### A-to-B detour

Use an ordinary journey with several plausible route choices. Ask a player to choose a route, then record whether they can:

- identify an attractive optional detour through reachable outbreaks or a Field Lab and explain why it is worthwhile;
- estimate the added distance and reward before choosing;
- understand the visit points, cleaning or lab recovery their crossing contributed afterward; and
- say whether the destination or resulting world state gives them a reason to return.

Use more than one familiar and unfamiliar route when practical. No route planner, automatic routing feature, success threshold or required detour distance has been agreed.

### Outing and reward return

Ask the player whether hunting one or several available Field Labs would motivate an outing they otherwise would not take, considering the reduced resistance-based point loss on subsequent familiar outings. Observe whether the actual recovery helps them want to return; how noticeable one lab should feel remains open.

After play, ask them to explain actual resistance reduction, ordinary visit points, committed cleaning, gradual shrinkage, potential cleanup bonuses and personal eligibility using the existing map, guide and recap. Check that they understand partial spatial recovery and continuing accumulation rather than expect a complete reset or a promised percentage. No outing-motivation or comprehension threshold has been agreed.

These are proposed product observations. Passing them would not establish correctness of automated rules, emulator integration, physical-phone behavior, outdoor GPS reliability or group/field acceptance.

## Question index

| Question | Status | Owner / next action |
|---|---|---|
| Which achievements should reward which experiences, without undermining renewable local exploration? | Open; owner has further ideas not captured here | Ask the owner when achievement work is scoped; do not infer requirements from this page. |
| Which A-to-B rides and observable outcomes show a worthwhile detour? | Proposed evaluation; thresholds open | Observe choices between reachable outbreak/lab opportunities and the usual route; agree any threshold separately. |
| Does Field Lab recovery motivate an outing when no commute is planned and make following familiar outings more worthwhile? | Recovery relationship confirmed; perceived benefit open | Observe the expedition decision and later local play; do not infer a new incentive or fixed recovery target. |
| Can players distinguish actual spatial resistance reduction, visit points, committed cleaning and conditional cleanup bonuses? | Open comprehension question within the confirmed loop | Use the existing map, guide and recap; check that recovery is understood without a full-reset promise. |
| When should size/category and strategic splitting work be scoped relative to visual integration and field validation? | Deferred; no ordering agreed | Use the [game concept](game-concept.md) and create a separate proposal before implementation. |
| Which implementation and acceptance claims are current, and which field gates remain? | Reconciled for this documentation pass; ongoing | Follow the evidence and next steps in the [roadmap](development-roadmap.md), [finished-goals record](finished-goals.md) and owning changes. |
| How should late historical events, duplicates and leaderboard settlement interact? | Open design question | See [game concept: open decisions](game-concept.md#open-decisions); resolve in an owning gameplay change. |
| How should contact boundaries, GPS accuracy and historical contact matching agree? | Open design question | See [game concept: open decisions](game-concept.md#open-decisions) and the [Field Labs and resistance design](../openspec/changes/archive/2026-10-22-implement-outbreak-resistance-and-field-labs/design.md) for its owned parameters. |
| What growth, proportional strength and lifetime-extension rules should be final? | Provisional/open | See [game concept: open decisions](game-concept.md#open-decisions); retain provisional values as provisional. |
| How should split corridors, inherited properties, rounding, density and replacement be finalized? | Open design question | See [game concept: open decisions](game-concept.md#open-decisions); size/category and splitting need their own scoped proposal. |
| How should visit-point rounding, diminishing recovery, regional launch thresholds and leaderboard settlement be set? | Open design question | See [game concept: open decisions](game-concept.md#open-decisions); agree values before treating them as requirements. |
| What replay event presentation and recap details are needed? | Open design question | See [game concept: open decisions](game-concept.md#open-decisions); refine with the owning UI work. |
| What location precision and protection-area boundary behavior should be used? | Open design question | See [game concept: open decisions](game-concept.md#open-decisions); privacy decisions remain separate from visual hiding. |
| What recording limits, Strava eligibility, invalid-activity handling and route-planning integration are needed? | Deferred/open | See [game concept: open decisions](game-concept.md#open-decisions); scope each integration separately. |
| What Field Lab/resistance parameters and late/offline settlement rules apply? | Provisional in archived gameplay evidence | See the [gameplay design](../openspec/changes/archive/2026-10-22-implement-outbreak-resistance-and-field-labs/design.md); its provisional defaults are not owner-confirmed answers. |
| What exact Motorola model and installed Android version will be used for field checks? | Open operational detail; does not block current work | Confirm on device before testing; see the [platform rollout](development-roadmap.md#platform-rollout). |
| When is Android mature enough to hand off iOS work, and when will an external tester be available? | Open sequencing question; no milestone agreed | Revisit after Android reaches suitable maturity; see the [platform rollout](development-roadmap.md#platform-rollout). |

## Resumption map and current handoff

- Field Lab and resistance gameplay: [archived proposal](../openspec/changes/archive/2026-10-22-implement-outbreak-resistance-and-field-labs/proposal.md) and [tasks](../openspec/changes/archive/2026-10-22-implement-outbreak-resistance-and-field-labs/tasks.md). The owner accepted task 4.4 for the current gameplay/integrated-presentation milestone, subject to revision; this does not accept field deployment, outdoor reliability or physical-phone behavior.
- Android outbreak visuals: [archived visual showcase](../openspec/changes/archive/2026-10-22-replicate-approved-visuals-and-showcase/tasks.md). Its ordinary-outbreak visual acceptance does not settle the product evaluations above.
- A separate synthetic Android replay handoff recorded a first accepted Tampere 03 contribution of 100 points, then collection of lab `lab-73-0-002d11f1039b`. The offer was 11.7286% at 4,354.96 m; settlement and restoration were 11.7341%, removing resistance 0.0539656255. The recap showed 0.59 km, 1m27s and 98 confirmed points for Tampere14; both outings totaled 198 points. `limited:false` and reconciled offer source were reported. The scenario demonstrates positive restoration in that synthetic replay. A separate calibration runner's 61.66% first-Friday reference was not persisted as Friday state; a full-week replay is still the next verification. This does not establish physical-phone or outdoor reliability.
- Size/category and strategic splitting: [game concept](game-concept.md); still needs a separate scoped proposal.
- Project direction, overview status and this question index: [completed reconciliation](../openspec/changes/archive/2026-10-22-align-product-direction-and-project-status/proposal.md).

Only the handoff available from the separate replay session is recorded above. No additional unprovided session feedback or owner achievement ideas are inferred. See [finished goals](finished-goals.md) for dated implementation evidence and limitations.
