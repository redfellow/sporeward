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

## Remaining lifecycle work

Geographic growth, non-uniform withering, replacement scheduling, historical matching against changing shapes, disintegration/remnant geometry and field-data migration remain unfinished. The generated world currently retains the same disabled geographic growth experiment as the earlier encounter slice. PostgreSQL persistence is a foundation for this work, not proof that the complete lifecycle has been implemented.

Spatial operations follow the [PostGIS documentation](https://postgis.net/docs/), and transactions follow [node-postgres's single-client transaction guidance](https://node-postgres.com/features/transactions).

The geographic resize module now grows connected regions into available access cells around occupied neighbours and removes branches according to local cleaning heat while retaining a connected, hole-free contour. Its focused checks pass. It is not yet connected to authoritative lifecycle ticks or historical footprint capture; the live replay map still uses static geometry. Continuous contour animation, replacement scheduling and remnant placement remain to be implemented.

The authoritative world store now captures shape versions as half-open timestamp intervals and matches activity contacts against those historical versions. Both file snapshots and PostGIS retain the same history. Checks verify that a contact before a contour transition uses the old shape and the transition timestamp uses the new shape, without rewriting earlier positions. Geographic lifecycle tick integration remains pending, so this establishes historical matching semantics rather than demonstrating a fully evolving world.

Spatial lifecycle advancement is now available in the authoritative store when supplied the access-cell graph. Each minute advances the engine and captures actual contour changes. Accepted-contact heat guides connected branch removal. Disintegration places separated nearby remnants, conserves the parent bonus budget, retires the parent footprint and retains its engine identity for existing contribution/recap references. A constrained placement falls back to one remnant using the former footprint. Focused tick/geometry/bonus checks pass. Replacement spawning, continuous boundary motion, historical treatment after retirement and deployment of this lifecycle into the active replay API remain unfinished.

The geographic lifecycle is now enabled in both the isolated native API and the `living-tampere` virtual scenario (`world: "tampere"`). The native API uses a separate `native-living` database namespace, preserving earlier replay snapshots. Ordinary density is replenished independently of remnants; the initial provisional schedule checks for one replacement after 60 minutes, then every 30 minutes. A five-rider private-track scenario earns 200 points per rider, clears an outbreak and creates a five-cell replacement, returning to 20 ordinary outbreaks. Reset and re-run reproduce the full result object. These scheduling values still need to join the shared configurable balance rather than remain local constants.
