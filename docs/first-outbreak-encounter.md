# First outbreak encounter field test

Record an outing, touch one or more purple test outbreaks, finish, and upload. The activity shows a running **provisional** visit score and turquoise outlines for outbreaks touched during that activity. At least **500 m of continuous GPS coverage** is required for points. Upload completion returns a server-confirmed recap; later refreshes add any earned cleanup bonus. A pending cleanup bonus is a possibility, not an award: another visitor can become the finisher.

The five fixed locations are Hatanpää, Pyynikki, Tammerkoski, Kauppi and Kaleva. **Fit outbreaks** shows them together; **Fit route** returns to the recording. Purple means eligible, gray means unavailable, turquoise means touched during this activity, and pale purple means enough cleaning is committed to clear it. The compact list shows visit points, the locked cleanup bonus and the estimated visits still required after committed treatment.

Configure the existing tester credentials to load the world. The app refreshes while visible, approximately every 20 seconds, and caches the last validated map in SQLite for offline use. Recordings remain local until explicit upload. Cached estimates may change when the server checks them.

## Implemented rules

- GPS contacts use timestamped fixes, 10 m boundary tolerance and interpolation only between fixes in the same recording section at most two seconds apart. Pauses and longer gaps never create contacts along the missing route.
- The first contact with each outbreak in an activity is considered. Activity validation checks the 500 m distance threshold and the 24-hour upload window. Ineligible diagnostic uploads earn no points and cause no cleaning.
- A first eligible visit earns 100 points. The six-hour per-player cooldown and gentler repeat-cleaning reductions use the shared balancing engine. Visit times determine eligibility; delayed uploads start their treatment when accepted, rather than erasing outbreaks retroactively.
- Each accepted visit contributes 25% of its cleaning over five minutes and 75% over twelve hours. The test engine advances in whole-minute ticks. The cleanup bonus is locked at 100 points. Finishing/group/protection awards follow the shared engine.
- An atomic server snapshot stores the world, contributions and processed activity results together. Concurrent completion requests, interrupted uploads and retries after restart do not add another contribution. Overlapping sources can supply earlier contact times without duplicating cleaning or points; distinct outbreak contacts remain eligible for consideration.
- The server-confirmed recap distinguishes visit points, cleanup points, rejected contacts and possible future cleanup points. Refreshing an uploaded activity can confirm a bonus after gradual cleaning finishes.

## Deliberate limits of this test slice

This is a fixed five-outbreak world using the existing single-tester Basic Auth identity, not an account or leaderboard implementation. Shapes are rounded outlines derived from five adjacent level-17 cells. Geographic footprints remain fixed while cleaning reduces strength and visual intensity. Automatic spawning, moving growth boundaries, cracks/splits, support-squad animations and live contributions before activity upload follow later. The fixed fixture geometry and spawn/clear timestamps make historical contact matching reproducible without claiming the full geographic lifecycle engine is complete.

The file adapter runs in one server process and is intended for this test deployment. PostgreSQL/PostGIS and transactional multi-instance operation remain on the architecture roadmap. Do not run two API processes against the same snapshot directory.

## Persistence and API

`GET /world` returns validated map geometry, eligibility and cleaning estimates. `POST /activities/:id/complete` returns the normal upload receipt plus encounter results. `GET /activities/:id/encounters` refreshes the confirmed recap. All deployed endpoints require the existing HTTPS tester authentication.

`WORLD_DATA_DIR` selects the snapshot directory. Docker stores `/data/world/world.json` in the same persistent volume as uploaded activities. Restarting/rebuilding the container retains both. Do not delete the volume to reset a test.

## Repeatable verification

The encounter tests cover contacts, minimum distance, delayed treatment, concurrent/restarted retries, overlapping sources, group bonuses, provisional tally and validated map responses. Run the full workspace check when the assembled feature is ready for verification:

```sh
npm run build:lab
npm run check
```

A private recorder upload payload can be replayed against an isolated copy of the Tampere fixtures without uploading it or adding its coordinates to the repository:

```sh
npx tsx scripts/replay-field-encounters.mts /absolute/path/to/private-upload-payload.json
```

The replay prints distance and encounter results, checks an identical completion result after restart, then removes its temporary world. Native field testing still needs an actual outing; synthetic GPS and unit tests cannot prove screen-off reliability.

## Public path references

The central cell of each fixture contains a public OpenStreetMap path point checked on 14 October 2026. Map access tags support route selection but do not override conditions or signage on the ground.

| Fixture | Public access path |
|---|---|
| Hatanpää | [OSM cycleway 1395823937](https://www.openstreetmap.org/way/1395823937) |
| Pyynikki | [OSM cycleway 362855212](https://www.openstreetmap.org/way/362855212) |
| Tammerkoski | [OSM cycleway 23360065](https://www.openstreetmap.org/way/23360065) |
| Kauppi | [OSM path 866014201](https://www.openstreetmap.org/way/866014201) |
| Kaleva | [OSM cycleway 120553071](https://www.openstreetmap.org/way/120553071) |

## Android use

While recording, the map follows the recorder's latest fix without starting a second location watcher. **Explore map** suspends following; **Follow me** restores it. Fitting the route or outbreaks also allows exploration. Recording diagnostics are expandable so the score and map take priority on the main view.

## Verification — 14 October 2026

- The assembled feature passed all 61 workspace tests and all workspace typechecks. A later focused server check also covers keeping an earned bonus attached to its original activity after protection-window revisits.
- Replaying the private 13 October phone recording yields 1,593 m of continuous GPS coverage, a Hatanpää contact and 100 visit points. Restarting the isolated replay store and completing again returns the same result.
- A 680 m synthetic Kaleva outing through the native emulator recorder shows a held contact before 500 m, then 100 provisional points, a turquoise visited footprint and a 100-point confirmed upload recap. Re-uploading leaves one contribution, one visit and 100 points. These synthetic visits used an isolated loopback API and did not change the public world.
- The deployed WSL container retained its five outbreak identities and spawn time through restart. Public HTTPS world and health responses, unauthenticated/invalid-auth rejection and the expected unknown-route response were checked after proxy recovery.
- The final standalone ARM64 APK, with compact recording details and map-follow controls, was installed on the idle Galaxy Z Fold5 without uninstalling or clearing its recordings. Packaged recording permissions pass. The next real outing remains the field validation of the encounter slice.
