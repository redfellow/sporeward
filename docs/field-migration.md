# Field data migration

The field API switched to PostgreSQL and individual tester accounts on 2026-10-16. The final quiesced backup is stored privately under ignored `work/field-backups/2026-10-16-final`. It contains four upload receipts and three processed activities. After import, scores, contributions and processed activity records were verified unchanged. The original activity volume remains mounted, and the original image and compose configuration are retained for recovery.

The owner's account is bound to the original canonical player identity. Login over public HTTPS was verified without exposing credentials. The urban access map is active with a target density of 600 ordinary outbreak fixtures across the expanded Tampere riding area. Credentials are stored only in a private ignored onboarding file; they are not embedded in the app.

## Guarded snapshot import

```sh
node --env-file=work/replay/database.env --import tsx scripts/migration/import-world.mts work/field-backups/2026-10-15/extracted/world/world.json --world=field-backup-20261015
```

This imports the validated snapshot in one transaction, including world geometry, contributions and reward ownership. It records a digest of the exact source. An identical repeat is a no-op; another source or a populated destination without that import record is rejected. Import does not advance the clock, replay GPS or issue points. The real backup was verified byte-equivalent in data after database storage.

## Spatial preview

```sh
node --env-file=work/replay/database.env --import tsx scripts/migration/preview-spatial.mts work/field-backups/2026-10-15/extracted/world/world.json --world=field-spatial-preview-20261015
```

The preview preserves existing outbreak identities, cooldowns, contributions and rewards. It recovers the known prototype cell layouts, adopts the configurable ordinary lifecycle and adds fresh five-cell outbreaks until ordinary density is 20. New spawns follow the bounded public access map; legacy footprints retain their positions. Upgrade metadata makes preparation idempotent. The observed preview retained all five original outbreaks and its contribution identity, with unchanged scores.

Use `scripts/migration/check-import.mts` against the isolated database to verify repeat import, changed-source rejection, populated-destination preservation and corrupt-reward rejection. Its disposable namespaces are cleaned up after the check.

## Phone onboarding

Sign in through **Outings & setup → Tester account**. Use **Link earlier outings** and its explicit confirmation to associate unassigned local phone recordings with the linked account. This preserves recording data and receipts; it does not replay historical GPS or award points twice. See [Tester accounts](tester-accounts.md).

The older baseline spatial preview above remains an isolated migration example. The deployed configuration uses `WORLD_ACCESS=urban` and `WORLD_DENSITY=600`.

The southern extension includes Säijä, Nurmi and Lempoinen. Its idempotent migration added 100 outbreaks, preserving existing scores, contributions, bonuses and activities. Current fluid silhouettes retain earlier contours in footprint history for delayed GPS matching.

## Offline shoreline preflight

```sh
node --import tsx scripts/migration/preview-shorelines.mts PRIVATE_SNAPSHOT.json
```

This command freezes the snapshot clock and runs continuous-surface and shoreline preparation on an in-memory copy. It does not connect to a database or write migrated world state. Keep source snapshots under ignored private storage. It checks that scores, contributions, bonuses and activities are unchanged and reports elapsed time and peak memory. A 500-fixture regional preview took 46.6 seconds for continuous surfaces and 1.53 seconds for shorelines locally; the current public field world has not yet been preflighted or migrated.
