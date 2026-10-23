# Product direction

This page records confirmed priorities and proposed ways to evaluate the player experience. Normative rules live with their [OpenSpec capability owners](../openspec/specs/); implementation and acceptance status lives in the [roadmap](development-roadmap.md) and dated [finished-goals evidence](finished-goals.md).

## Confirmed priorities

1. Make a ride from A to B a little longer when a worthwhile detour offers a chance to visit somewhere unfamiliar.
2. Motivate an outing that otherwise would not happen.
3. Grow scores and competition. The owner is interested in achievements and has ideas, but no achievement system or requirements have been specified.

Exploration must remain renewable. Do not make permanent tile exhaustion push every rewarding destination farther away. Familiar routes and a thirty-minute local walk should remain worthwhile. A weekly work/commute rhythm matters; weekend adventures should add meaningful benefit without making long rides mandatory maintenance. Shared destinations support co-op: one rider must not consume another rider's opportunity.

These priorities guide evaluation; they do not define additional gameplay rules or numeric targets.

## Confirmed MVP loop (native recording)

MVP activity participation is based on outings recorded with Sporeward's native recorder and submitted to the account-backed shared world. Strava import is deferred beyond MVP. Its eligibility, invalid-activity, overlap with native recordings, and delivery/retry rules remain open and are not MVP requirements.

An ordinary A-to-B journey can become a little longer when a reachable outbreak or Field Lab makes an optional detour worthwhile, sometimes toward an unfamiliar place. Familiar rides, commutes and short local walks remain useful; longer outings add benefit without becoming mandatory maintenance.

Weekday cleaning builds personal, spatial Outbreak Resistance, reducing ordinary visit points around regularly cleaned places. A weekend Field Lab hunt reduces accumulated resistance so subsequent familiar outings lose fewer points than equivalent play without that recovery. Several labs can provide greater relief under diminishing returns. This does not promise a full reset, a fixed recovery percentage or a resistance-free following week; later cleaning continues to add resistance.

Recovery is most relevant where the player's contributions are concentrated. Local rewards use distance-weighted contributions, rather than one uniform global resistance meter. The displayed centre summarizes that geography. Cleaning outbreaks along an adventure can gradually shift the centre toward that direction as the concentration changes; following where the player actually plays is desirable.

The [renewable exploration contract](../openspec/specs/renewable-exploration/spec.md), [Field Lab contract](../openspec/specs/field-labs/spec.md), and [Resistance contract](../openspec/specs/outbreak-resistance/spec.md) own these mechanics. Resistance affects ordinary visit points; committed cleaning and cleanup bonuses retain their existing rules. Resistance activation is configuration-dependent, and this product contract does not establish field acceptance.

## Proposed evaluations

### A-to-B detour

Use an ordinary journey with several plausible route choices. Ask a player to choose a route, then observe whether they can identify an attractive optional detour, estimate added distance and reward, understand their contribution afterward, and say whether the destination or changed world gives them a reason to return. No route planner, automatic routing feature, success threshold or required detour distance has been agreed.

### Outing and reward return

Ask whether hunting one or several available Field Labs would motivate an otherwise-unplanned outing and whether the actual recovery makes later familiar outings more worthwhile. After play, ask the player to explain actual spatial resistance reduction, visit points, committed cleaning and conditional cleanup bonuses. Check that they understand partial recovery and continuing accumulation rather than expect a full reset or promised percentage. No motivation or comprehension threshold has been agreed.

These are proposed product observations. Passing them would not establish correctness of automated rules, emulator integration, physical-phone behavior, outdoor GPS reliability or group/field acceptance.
