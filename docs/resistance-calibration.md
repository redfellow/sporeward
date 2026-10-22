# Resistance calibration experiment

This pure-rules calibration supports prospective, opt-in server scoring; existing confirmed awards retain their original rules. Parameters are provisional and versioned in [`resistance.ts`](../packages/game/src/resistance.ts). Run focused checks with `npx vitest run packages/game/src/resistance.test.ts`.

Each accepted contribution records its stable identity, committed cleaning strength, explicit timestamp and one outbreak representative point. Retries and ineligible contacts add nothing. Scheduled treatment delivery must not create another event. Resistance input is 0.23 per full contribution, with a seven-day exponential half-life. The single reward fraction is `0.25 + 0.75 / (1 + resistance)`: it passes through 50% at resistance 2, then approaches the 25% floor more slowly. Repeated contributions already enter this curve through their cleaning strength; legacy point halving must not be multiplied into it. Cleaning, eligibility and cleanup awards remain separate.

The provisional centre is the representative point with the strongest decayed concentration inside a five-kilometre linear falloff. Candidate history spans 56 days. Existing centres move at most 500 metres per elapsed day; outing references copy the established centre. The weighted-average comparison intentionally exposes the limitation of a mean between separated routines. Concentration chooses the stronger cluster; ties use stable event order. A single circle cannot faithfully represent multiple distant routines. These fixtures establish deterministic behaviour, not geographic product acceptance. The geographic helpers target the Tampere region; coordinate averaging and movement interpolation are not a global dateline model.

Keep event history for identity and historical calculations; the centre horizon does not delete contributions or their decayed familiarity. No live GPS crossing or movement enters the established reference.

Restoration scales linearly with distance up to 10 km and removes at most 80% of remaining resistance. Each distinct collection increases personal collection load by one, recovering exponentially with a one-day half-life from settlement. The successive factor is `1 / (1 + 2 * load)`. Different lab identities and two-hotspot alternation share this load. Frozen offers are maxima capped again at settlement. A zero-resistance collection still counts, but cannot reduce future contributions. Global restoration multiplies preceding contribution inputs known at settlement; subsequently imported history cannot enlarge an earlier restoration. It never changes cleaning or confirmed points. The [server integration](field-labs-integration.md) builds on these functions.

## Four-week measurements (2026-10-21)

Run `node --import tsx scripts/replay/resistance-calibration.mts` from the repository root. Output is deterministic JSON; all coordinates are synthetic representative fixtures. This runner exercises pure rules, not recorded GPS validation, isolated persistence or authoritative collection. The owner clarified that the first-week target concerns Friday's reward state; weekly averages are comparison metrics.

The reference commuter makes two contacts six hours apart each weekday with one persistent target. Ten contributions commit 5.85 full-strength equivalents in week one; later visits commit half strength. Weekly Friday reward is measured after that week's contributions, at 20:00. Weekly mean prices each accepted contact before adding its resistance. Weekend collection occurs Saturday at noon, with an established reference and synthetic 10 km offer. Local walks make one weekday contact; high-mileage makes four contacts six hours apart and collects a distinct capped-distance lab after each. Multiple targets use three colocated representatives. Replacements use fresh full-strength targets each visit. Alternating hotspots use separated representatives and one weekly collection; this is a geography comparison, not an accessibility claim.

| Scenario | Mean rewards, weeks 1 / 2 / 3 / 4 | Friday rewards, weeks 1 / 2 / 3 / 4 | Immediate weekend rewards |
| --- | --- | --- | --- |
| Commute | 74.76 / 60.89 / 56.94 / 55.28% | 61.66 / 55.73 / 53.43 / 52.40% | — |
| Weekend adventure | 74.76 / 74.03 / 73.85 / 73.83% | 61.66 / 62.08 / 62.01 / 62.00% | 87.72 / 87.33 / 87.29 / 87.28% |
| Local walks | 84.00 / 72.93 / 69.91 / 68.54% | 72.30 / 67.95 / 66.06 / 65.18% | — |
| Alternating hotspots | 85.38 / 84.73 / 84.62 / 84.61% | 70.07 / 71.33 / 71.34 / 71.35% | 91.71 / 91.78 / 91.79 / 91.79% |
| Fresh replacements | 68.93 / 50.00 / 45.78 / 44.19% | 51.45 / 44.98 / 42.80 / 41.88% | — |
| High-mileage collections | 76.21 / 67.45 / 66.92 / 66.88% | 64.26 / 62.71 / 62.61 / 62.60% | — |
| Multiple targets | 54.96 / 42.19 / 39.57 / 38.54% | 43.13 / 39.09 / 37.68 / 37.07% | — |

The first weekend improves the next week's mean from 60.89% to 74.03% and Friday reward from 55.73% to 62.08%. Intensive collection does not sustain full rewards. Fresh replacements retain familiarity but increase resistance faster because they commit full cleaning strength. The multiple-target variant also accumulates more committed strength; neither variant is calibrated to the single-target 50% reference.

The clarified first-week Friday target is met at 61.66%. The approximate four-week 50% target reaches 52.40% at Friday, and the weekend reference reaches 87.28–87.72% immediately. These satisfy the provisional reference targets; multi-target and fresh-replacement outcomes remain explicit comparisons rather than promises of equal rewards for different committed strength. All tuning remains provisional.

The calibration runner remains a pure-rules comparison. Server/protocol/migration verification is recorded separately in [resistance integration](resistance-integration.md) and [Field Labs integration](field-labs-integration.md). Android presentation and deployment are not established by these measurements.
