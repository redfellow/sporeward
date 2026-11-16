# Design

## Context

The merged native guide and outing-history slices are in main. `RouteMap` already owns temporary selected-outbreak/lab cards, native hit targets and camera controls. `Game` owns account changes, recording state and world polling. Current lab offers are requested for an actual outing; the idle map must not manufacture them. See proposal.md for the product motivation.

## Goals / Non-Goals

**Goals:** One useful, readable destination pin, accurate reward language and bounded native map work.

**Non-Goals:** Automatic routing, route planning, navigation instructions, ETA, a nearby-destinations catalogue, multi-stop routes, persistent cross-device plans, new location permissions, new gameplay or service changes.

## Decisions

- Keep a small `{kind, id}` target in the mounted app owner, separate from expanded map-card state. App ownership preserves the pin across help/history navigation; map-local state would disappear on remount. Derive all visible data from the latest world rather than storing duplicated rewards and geometry.
- Keep pinning explicit in destination details. Close expanded details into a compact target summary; provide separate clear and show-target controls. Do not automatically advance to another target after a contact.
- Use a pure summary selector so cooldown, remnant, clearing, collected/provisional lab and missing-target behavior can be checked without Android startup. Keep authoritative and provisional evidence distinct.
- Compute distance to the contact polygon in a local metric projection from an already available recent recording fix or known idle location. Preserve timestamp information for idle locations. Two minutes is the proposed presentation freshness limit, not a GPS contact eligibility rule. Do not start a new location watch or treat distance as contact evidence.
- Reuse current native GeoJSON geometry for a separate target highlight. Do not alter the accepted lifecycle/contact artwork or add a screen-space camera-following overlay. Fit only in response to show target, preserving normal pan/follow controls.
- Clear the pin through existing account/environment reset paths. Disable target UI on historical recap maps so live state never replaces historical contact geometry.
- Adapt the summary to measured header/recording HUD insets. Keep expanded and compact cards mutually exclusive; leave map controls and the guide button usable on narrow layouts.

## Risks / Trade-offs

- [Direct distance can be mistaken for a ridable route] → Explicitly label it straight-line/direct and provide no ETA or detour estimate.
- [World or location data can be stale] → Use existing map status, require a recent timestamp for distance and show unavailable targets honestly.
- [A recorded contact is mistaken for an award] → Derive provisional contact from existing evidence; retain server confirmation and eligibility language.
- [More HUD obscures the map] → Show one compact pinned summary and expand only on request; retain existing inset measurements.

## Handoff

Owner: root session in `/Users/red/Koodit/sporeward`, branch `feat/map-destination-focus`, based on origin/main after PRs #22, #23 and #24 merged. The owner accepted the plan and requested apply on 24 October 2026.

Implementation is delivered and independently reviewed with no blocking findings. Eight focused destination/distance tests passed, the mobile TypeScript check passed, and Expo exported the Android JavaScript bundle without running an emulator. Strict validation and `git diff --check` passed. No recorder, upload, server or gameplay-rule implementation was changed.

Idle location is the already-available last-known position, read when the map mounts. Without newer outing fixes, its direct distance becomes unavailable after two minutes; no new location watch was added. Phone acceptance remains open in task 3.2, including narrow/wide HUD readability, show-target behavior and pin persistence through help/history. Existing phone acceptance for outing history and the native guide stays open in their own changes.

Disposition: publish this change's implementation and planning files from `feat/map-destination-focus` in a PR targeting main, as requested by the owner on 24 October 2026. Keep the PR unmerged for owner review. Phone layout and interaction acceptance in task 3.2 is explicitly deferred; do not sync or archive this change before that gate passes. Main does not yet contain this feature. The investor concept PNG and prompt remain unrelated untracked artwork, preserved locally and excluded from this feature commit. Next action: owner PR review and physical-phone acceptance when convenient; other feature planning can proceed independently.
