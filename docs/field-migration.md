# Field data migration — prepared, not deployed

The field API remains running on its original file store. A private read-only backup under ignored `work/field-backups/2026-10-15` retains its world snapshot and activity files. Both stored recordings match the preserved canonical owner; every contribution-referenced upload has its manifest, receipt and chunks. Raw tracks and the archive are not committed.

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

## Remaining cutover

The production entry point and container configuration still need database/account wiring. Before switching the field API, take a final quiesced snapshot so requests accepted after the earlier backup are retained, import it into the intended destination, preserve the original activity volume and provision the administrator-bound owner account/invite. Keep the original files and backup available for rollback. Link local phone recordings only through the explicit confirmation flow described in [Tester accounts](tester-accounts.md).

The preview is separate from the live field world. No field data has been replaced, and no real owner account has been assigned silently.
