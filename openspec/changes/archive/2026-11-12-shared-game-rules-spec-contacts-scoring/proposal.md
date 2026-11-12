# Proposal

## Why

The shared game rules in `packages/game` and the server's Field Lab, lab settlement and resistance state are merged on main, but their specs leave out several rules the code and unit tests already enforce. This is part 3 of 5 of "OpenSpec specifications for existing project features": write down the shipped rules so later balance changes have a baseline.

## What Changes

- `visit-scoring`: add the per-player 6-hour visit cooldown, the rejection reasons, repeat cleaning strength, cleanup bonus awards (last-visitor finishing group and the 10-minute protection window), and the remnant and historical-visit outcomes.
- `gps-contact-matching`: add the input validation (timestamps required, fixes in order) and earliest-contact selection across footprint versions.
- `outbreak-resistance`: add the fixed resistance rules (7-day half-life, 25% floor, soft threshold at half reward), idempotent contribution identity, the neutral start with no backfill of old uploads, and per-account isolation of offers and awards.
- `field-labs`: add the deterministic spawn of two labs at least 2 km apart with a 7-day lifetime; the frozen per-outing offer valid for 24 hours; contact checks against expiry and eligibility at contact time; quoted versus reconciled settlement; and ordering of ordinary and lab contacts by recorded time.
- `renewable-exploration`: no delta. Its requirements are product-level and are already backed by the deltas above.
- No code, test or gameplay changes.

Direction: the Steward's split changed the origin in four ways. It is documentation only. It prefers ADDED deltas to existing capabilities. It requires a test or source citation for every requirement. It excludes behavior owned by the five active changes.

## Assumptions

- Numeric values are stated as current provisional code parameters, as the existing specs already do. The alternative, leaving numbers out, was ruled out because tests already pin them.
- The planning engine says it is "not yet the authoritative GPS/world engine", but `apps/server/src/world-store.ts` uses it. Its rules are therefore treated as shipped. Strategic splitting is left out because ordinary worlds keep it disabled.
- Open question, not specified: whether lab spawn count and separation are product rules or test-world tuning.
