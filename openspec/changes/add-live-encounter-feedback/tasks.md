# Tasks

## 1. Model honest contact feedback

- [x] 1.1 Add a pure contact-feedback reducer/formatter for outbreak and lab evidence, estimates/held points, known cooldown versus unknown zero estimates and matching authoritative outcomes; verify synthetic tests cover per-target deduplication, original contact time, delayed/changed evidence, rapid grouping, bounded pending feedback and no duplicate totals or inferred awards.

## 2. Retain and ingest current-outing evidence

- [x] 2.1 Add an idempotent local feedback table and owner/context-scoped read/upsert operations through the existing writer; verify isolated SQLite tests cover repeated insertion, restart/reopen, announcement consumption, field-lab retention, identity isolation and additive setup with existing recordings/previews/receipts preserved. Document local persistence and rollback boundaries in the change design.
- [x] 2.2 Add app-owned active-outing ingestion using existing outbreak observations and shared-matcher lab contacts, with hydration/foreground catch-up silent and live evidence distinct; verify focused sequence tests cover startup races, navigation/remount, pause/resume, delayed world loading, expiry/removal, reset cancellation and receipt reconciliation without changing GPS matching, scoring or recorder/upload behavior.

## 3. Present notices and Recent contacts

- [x] 3.1 Add bounded live notices and a virtualized current-outing Recent contacts sheet, coordinate with Nearby/target cards/cleanup feedback, preserve pause/finish and Back behavior, and update player rules; verify mobile TypeScript, Android JavaScript export, scoped navigation/source checks and documentation links. Record actual check scope separately from phone appearance/gesture acceptance.

## 4. Review and accept the slice

- [x] 4.1 Obtain independent implementation review against this change and address blocking findings; pass strict OpenSpec validation and `git diff --check`, and record integration evidence, storage boundaries, Git/dependency status and pending phone acceptance in the handoff.
- [ ] 4.2 Obtain owner phone acceptance on narrow/wide layouts: fresh contact notice, grouped contacts, Recent contacts/Back, points-held and lab wording, screen-off return without a banner burst, map/pin continuity and accessible pause/finish. Keep this separate from automated checks, native background reliability and earlier feature phone gates.

## Workflow follow-up

- The owner approved the artifacts and requested apply on 24 October 2026. Work runs on `feat/live-encounter-feedback`. PRs #25 and #26 are now merged; publication uses their merged `main` base (`1ef59ab`).
- The owner requested a commit and separate PR to `main`, with phone layout testing later. Keep task 4.2 pending; publication does not satisfy owner acceptance.
- Prefer focused synthetic reducer/storage/controller tests and an Android JavaScript export. No full-suite, emulator startup or new outdoor outing prerequisite; physical-phone acceptance remains task 4.2.
- No baseline sync/archive before independent review and required owner acceptance. Commit, push and PR creation remain separately authorized actions.
