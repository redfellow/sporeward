# Tasks

## 1. Isolated PostGIS replay harness

- [x] 1.1 Add a replay entry point that requires `REPLAY_DATABASE_URL`, refuses to fall back to the shared replay server's configured world or generic `DATABASE_URL`, reports the connected database name, and assigns unique world IDs per run; verify connection guards and ID isolation with focused checks.
- [ ] 1.2 Implement cleanup scoped only to the run's generated world IDs, including persisted footprints, contributions, bonuses and snapshots; verify a run leaves unrelated world IDs and their records unchanged.

## 2. Persisted matched-week comparison

- [ ] 2.1 Reuse the existing server endpoints and deterministic replay path to run matched weekday cleaning, weekend outing, and following-week routes with and without a Field Lab collection; verify both arms use identical inputs apart from collection and report measured visits, points, offer and actual restoration without fixed percentage assertions.
- [ ] 2.2 Reconstruct the world/app persistence after collection, retry completed activity and collection requests, and verify recaps, account totals, collection state, resistance and PostGIS contact history remain consistent; run the scenario twice and confirm deterministic aggregate output.
- [ ] 2.3 Document prerequisites, the exact command, isolation and cleanup behavior, result interpretation and evidence limits in `docs/replay-tool.md`; record the aggregate PostGIS run and its database/fixture identity in `docs/field-labs-integration.md` without GPS coordinates or credentials, then verify documented commands and local links.
