# Proposal

## Why

The app already keeps finished outings, but the history list shows only a timestamp and a generic recap action. Testers cannot quickly recognize an outing from its route or tell whether a score is confirmed, still uploading, or has not been submitted.

## What Changes

- Show each finished outing as a card with a small basemap route heatmap, touched outbreaks, local start time, recorded GPS distance, active recording duration, upload state, and corner score badges.
- Use the same dedicated full-screen map recap after finishing an outing and when opening a history card: an A-to-B route heatmap, visually highlighted touched outbreaks, and corner score badges.
- Retrieve historical outbreak footprints for the authenticated player's processed outing so the recap highlights the shapes that existed at each contact time.
- Keep confirmed points and possible cleanup points distinct, and show confirmed score values only from an authoritative server recap; label local estimates separately.
- Return from a history recap to the previous outing list using Android back navigation, and keep the list scoped to the signed-in account.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outing-feedback`: Finished outing cards and their full-screen map recaps provide route context and clearly distinguish confirmed points from conditional rewards.

## Impact

This changes the React Native outings list and recap/map presentation, adds a private activity-footprint API backed by existing historical PostGIS geometry, and extends the shared protocol. It does not change activity upload, scoring, GPS collection, or world state.
