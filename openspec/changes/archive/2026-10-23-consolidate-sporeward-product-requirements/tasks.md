# Tasks

## 1. Establish the agreed MVP contract

- [x] 1.1 Build a statement-by-statement traceability ledger from the product, roadmap, player and implementation documents to code, existing OpenSpec requirements, and dated verification evidence; verify every entry is labeled confirmed, provisional, implemented, verified, accepted, deferred or open, with source links.
- [x] 1.2 Resolve which product behaviors belong in the agreed MVP and which remain unaccepted or deferred; verify the resulting MVP boundary reflects the owner's decisions and does not promote tentative values, illustrative previews or code presence into product requirements.
- [x] 1.3 Reconcile conflicting rule descriptions against the owner's intended rule and authoritative code path, including cooldown, splitting activation, browser scope, resistance activation and leaderboard scope; verify each conflict is either decided and traceable or retained as an explicit open decision.

## 2. Express approved MVP behavior in OpenSpec

- [x] 2.1 Group approved behavior into cohesive capability specifications, reusing the existing Field Labs, Outbreak Resistance and Outbreak Visuals capability paths; verify no requirement is duplicated across capabilities and every normative requirement has concrete WHEN/THEN scenarios.
- [x] 2.2 Record implementation and acceptance gaps alongside the requirement handoff, distinguishing implemented behavior, automated/replay evidence, emulator/phone review, outdoor reliability and production readiness; verify each status claim links to evidence of the stated scope.
- [x] 2.3 Validate the resulting capability set with `openspec validate --all --strict`; verify deferred ideas and unresolved choices are not written as normative MVP requirements.

## 3. Reconcile and condense the documentation

- [x] 3.1 Revise `docs/game-concept.md` and `docs/player-rules.md` to explain the product idea and player experience without duplicating capability requirements; verify the guide describes only approved behavior available in the stated product slice and corrects resolved contradictions.
- [x] 3.2 Reconcile `docs/development-roadmap.md`, `docs/architecture.md` and `docs/product-direction.md` to their defined roles; verify roadmap gates point to current owning changes/evidence and no removed current-goal checklist is recreated.
- [x] 3.3 Add a sparse `docs/future-ideas.md` and move only deferred, owner-recognized goals into it; verify entries are brief, non-normative, contain no acceptance scenarios or implied commitments, and can be promoted later through a new proposal.
- [x] 3.4 Review the operational, experiment and historical docs in the design's disposition table; retain unique procedures and dated evidence, remove or refresh stale status narration, and verify all local Markdown and image links resolve.

## 4. Verify the consolidated source of truth

- [x] 4.1 Cross-check every approved MVP requirement against its source decision, code path and stated evidence limit; verify no contradictory normative copy remains in player guidance, roadmap or integration notes.
- [x] 4.2 Run `openspec validate --all --strict` and the focused Markdown link/reference checks; verify the accepted capability set is internally consistent and historical completion records remain clearly dated rather than presented as current status.
