# Proposal

## Why

Tester accounts, account-scoped activity upload, retry-safe receipts and the tester score board are merged on main but only one ownership requirement and one source requirement describe them. This is part 1 of 5 of "OpenSpec specifications for existing project features": record the shipped server contract so later changes have a baseline.

## What Changes

- `account-owned-play`: add requirements for invite-only tester registration, password sign-in with 30-day sessions, session-required API access behind the gateway, sign-out revocation, invite-bound legacy owner linking, per-account upload storage and the tester score board.
- `activity-recording`: add requirements for batched upload validation, idempotent immutable batches and completion, the completion receipt with eligibility reasons, and attaching encounter results to the receipt.
- No code, test or gameplay changes.

Direction: the Steward's split narrowed the origin to documenting merged behavior only, preferring deltas to these two existing capabilities (no new capability), and excluding the footprints endpoint (owned by `enrich-past-outing-history`), lab offers and scoring rules (other parts).

## Assumptions

- Requirements cite source where no focused test exists (account store validation, invite expiry, session lifetime); the alternative of adding tests was ruled out by the documentation-only constraint.
- Lab-offer and `/world` routes are left to the world/shared-rules parts rather than specified here.
- Open question, not specified: the client-side sign-out confirmation and local token storage described in docs/tester-accounts.md belong to the Android part.
