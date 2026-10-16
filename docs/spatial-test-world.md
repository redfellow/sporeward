# Generated Tampere test world

The isolated native replay API now uses 20 seeded, five-cell outbreaks generated from a saved public OpenStreetMap access extract. The bounded area is approximately 5 × 5 km around central Tampere. This replaces its previous five named fixtures; the shared field API remains on its existing fixtures and file storage until migration is ready.

## Accessibility and geometry

The snapshot retains public road/path geometry and access tags, with source date and attribution. It contains no player activity data. Rasterization follows exact level-17 tile boundary crossings along mapped ways, rather than checking only occasional way nodes. Fully bounded cells containing a permitted walking or cycling route form the spawn candidates. Private/restricted access, construction, steps and routes closed to both modes are excluded. This is map-based accessibility; it does not establish actual conditions or route quality.

A seeded generator picks connected five-cell layouts, removes shared edges and rounds their contours. Separate outbreaks start with an empty neighbouring cell between them. Every initial cell has mapped access. The stored snapshot produces 816 candidate cells and 20 outbreaks for seed 73; the recent private phone outing touches one of those generated outbreaks without influencing placement.

The public extract is compressed at `apps/server/data/tampere-access.json.gz` and carries **© OpenStreetMap contributors**, licensed under [ODbL](https://www.openstreetmap.org/copyright). Replay runs load this fixed snapshot and do not download changing map data on startup. Refresh explicitly with:

```sh
npm run world:access -- --osm-api
```

The direct API importer uses nine bounded requests to remain below the API node limit. Overpass is also supported by omitting `--osm-api`; `OVERPASS_URL` can select an alternate instance. A failed fetch leaves the saved snapshot intact. The API format and geometry query are described in the [OSM API](https://wiki.openstreetmap.org/wiki/API_v0.6) and [Overpass documentation](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL).

## Isolated PostGIS storage

`ops/replay/compose.yaml` runs PostgreSQL 17/PostGIS 3.5 with its own replay volume and a loopback-only port 55432. The authorized WSL development machine has this stack under `/home/red/sporeward-replay`. Its password is privately generated in that directory's `.env`; it is not an APK credential or player identity.

Reach it through SSH forwarding:

```sh
ssh -i ~/.ssh/windows-dev -N -L 127.0.0.1:55432:127.0.0.1:55432 red@100.108.68.30
```

A private ignored `work/replay/database.env` contains the local connection string. To run the native replay API with that database:

```sh
node --env-file=work/replay/database.env --import tsx apps/server/src/replay/bench.ts
node --env-file=work/replay/database.env --import tsx scripts/world/check-database.mts
```

Set disposable `REPLAY_USERNAME`/`REPLAY_PASSWORD` matching the emulator, as described in [Replay tool](replay-tool.md). Without `DATABASE_URL`, the isolated API uses its private file adapter. Switching storage selects a separate world; it is not an automatic import of previous snapshots.

Database operations lock one world and save the engine snapshot, PostGIS footprint intervals, contributions and stable bonus attribution in one transaction using a single checked-out client. Schema initialization is serialized separately. Resets carry an explicit generation and remove only the selected world's mirrored records. The repeatable database check creates a uniquely named disposable world, verifies valid geometry, persistence through adapter restart, rollback and reset, then removes only that check's records. It uses private GPS data and is separate from ordinary unit checks.

## Implemented lifecycle and replay evidence

The authoritative store can advance geographic growth and connected, non-uniform branch removal alongside each rule tick. Accepted contact heat guides which branch withers first. Neighbours use occupied-cell exclusion and growth searches around them. Disintegration places nearby separated remnants, conserves the parent bonus budget and retains parent identity for existing records. A constrained placement can fall back to one remnant using its previous footprint.

Historical shape transitions are retained as half-open timestamp intervals in the snapshot and PostGIS. GPS matching uses the footprint at the contact time. The geographic lifecycle runs in both the isolated native API and the `living-tampere` virtual scenario. Reset and replay reproduce the full scenario result, including group cleanup and replacement. The real database checks preserve changing geometry, contributions and rewards across adapter restart and rollback.

Ordinary density is replenished independently of remnants. The provisional 60-minute initial replacement delay, 30-minute check interval and remnant reach now live in shared `SPATIAL_BALANCE` and persist with the world. They can be configured for new worlds without changing scoring rules. Normal native recorder replay is separate from accelerated engine time; a faithful account-owned 120-second recording/upload check confirmed 100 points.

## Field migration preparation

The read-only private field backup contains both existing recordings and the five-outbreak world. Its exact snapshot has been imported into a separate PostGIS namespace without advancing game time or issuing points. The importer records a source digest, is idempotent for the same source, and rejects a changed source or a populated destination.

A separate spatial preview retains existing outbreak and contribution identities, history and scores, recovers the original prototype cell layouts, enables the ordinary lifecycle and adds new five-cell outbreaks to reach 20. Retained legacy footprints keep their original positions; newly generated spawns use the bounded access area. No live field cutover has been performed. See [Field migration](field-migration.md).

## Remaining work

Continuous contour motion, full long-running overlap/performance checks and historical treatment after retirement remain unfinished. The existing field API still uses its original file store until an atomic cutover is ready. PostgreSQL persistence and the preview are verified foundations, not completion of the full active goal.

Spatial operations follow the [PostGIS documentation](https://postgis.net/docs/), and transactions follow [node-postgres's single-client transaction guidance](https://node-postgres.com/features/transactions).

## Long-running lifecycle evidence

Run `node --import tsx scripts/world/check-lifecycle.mts --days=14` for an isolated, source-free geographic lifecycle check. It advances the seeded 20-outbreak world hourly, checks live/protected cell ownership for collisions, and requires at least 15 visible routing choices. The observed run maintained 20–100 visible targets, produced two generations of remnants/replacements and returned to 20 ordinary outbreaks by day 14. This checks occupied cells, not continuous polygon contour overlap.

Player-facing world responses now expose remnant/disintegration/stabilization states and relevant deadlines. Remnants advertise zero visit points and their one-touch cleanup bonus. Historical contacts on naturally retired parents receive visit credit without a false cleanup bonus or treatment of unrelated replacements; the preserved parent contribution remains idempotent. Further historical finishing-order reconciliation and continuous contour verification remain open.

## Fractional procedural contours

Ordinary outbreaks now evolve through a fractional edge cell rather than snapping a complete cell onto or off the footprint. Withering prioritises removable branches using contact heat while preserving the connected core. A selected fractional branch persists across updates. Fractions are quantized to 1/32 of a cell to bound geometric history, and deterministic per-outbreak edge rounding supplies variation without a silhouette library. At Tampere this is a few metres per step, rather than a whole level-17 cell. The map and historical matching consume the same resulting polygon.

Growth, replacement and remnant placement reserve separation from other live/protected footprints. The read-only PostGIS command `node --env-file=work/replay/database.env --import tsx scripts/world/check-contours.mts` verified 1,800 polygons across ten seeds and nine growth/shrink sizes, with no invalid rings or overlaps above 0.01 square metres. The database adapter now batches only changed footprint-history rows; restart, rollback and isolated reset checks still pass.

Regenerate [the interactive contour preview](visualizations/outbreak-contours.html) with `node --import tsx scripts/world/render-contours.mts`. It shows the real geometry algorithm, not an activity or scoring simulation. The mobile map adds a subtle foreground-only opacity pulse without moving the contact boundary; its timer stops when backgrounded. Full in-app lifecycle/layout verification remains open.
