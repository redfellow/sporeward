# Proposal

## Why

Sporeward’s product intent, current behavior, acceptance evidence, operations notes and open design questions are spread across many documents, and some status claims have drifted from the code and newer completion records. Consolidating the product contract now will make the game idea reviewable, prevent provisional ideas from becoming accidental requirements, and give future feature work a trustworthy starting point.

## What Changes

- Establish an evidence-backed product spine for Sporeward, including the intended player experience, core loop, accepted gameplay decisions, provisional balance, deferred ideas and unresolved owner decisions.
- Map each durable behavior to a cohesive OpenSpec capability and plan staged capability specifications with observable scenarios and explicit implementation/acceptance status.
- Reconcile and shorten overlapping concept, rules, roadmap, architecture, integration and status documents; retain concise player guidance, operational procedures and historical completion evidence where they remain useful.
- Cross-reference requirements to current code and recorded verification without treating code presence, automated checks, emulator review, owner acceptance, field reliability or production readiness as interchangeable evidence.
- Keep this change documentation and planning only. It records approved MVP behavior in OpenSpec but changes no runtime behavior, data, APIs or deployment.

## Capabilities

### New Capabilities

- `activity-recording`: record the approved native Sporeward activity source for MVP scoring.
- `account-owned-play`: record the existing account-attribution contract for accepted activities and their results.
- `outing-feedback`: record the confirmed-versus-conditional reward and recap behavior.

### Modified Capabilities

None. Existing exploration, contact, scoring, lifecycle, Field Lab, Resistance and visual baselines remain their own sources; this change does not duplicate or modify them.

## Impact

Planning and documentation: `openspec/changes/` including three new capability deltas, existing `openspec/specs/` baselines (reused without duplication), and selected `docs/` pages. The audit references the existing Android recorder, Fastify/PostGIS world, shared game and protocol packages, browser rendering lab, and replay tooling, but does not modify them. These deltas document the approved MVP contract; runtime implementation, deferred integrations and unresolved decisions remain outside this change.
