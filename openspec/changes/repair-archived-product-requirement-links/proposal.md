# Proposal

## Why

When `consolidate-sporeward-product-requirements` moved under `openspec/changes/archive/`, relative links in its archived design and traceability ledger retained their active-change depth. The paths now fail from the archived location, making cited requirements, code, and evidence harder to inspect; the independent review requested a scoped repair.

## What Changes

- Repair relative links only in the archived [design](../archive/2026-10-23-consolidate-sporeward-product-requirements/design.md) and [traceability ledger](../archive/2026-10-23-consolidate-sporeward-product-requirements/traceability.md), adjusting targets for the archived directory depth while preserving the text and historical findings.
- Add scoped link validation for those two files, checking that each local target resolves from its archived file and that any referenced heading exists.
- Leave all other archived artifacts and current documentation unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This repairs documentation references without changing product behavior; `skip_specs: true` is set.

## Impact

- [Archived consolidation design](../archive/2026-10-23-consolidate-sporeward-product-requirements/design.md)
- [Archived consolidation traceability ledger](../archive/2026-10-23-consolidate-sporeward-product-requirements/traceability.md)
- A scoped local Markdown link check for those two files only.
