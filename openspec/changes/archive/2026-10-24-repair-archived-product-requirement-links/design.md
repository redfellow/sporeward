# Design

## Context

See [proposal.md](proposal.md) for the finding and scope. The affected files are the archived [design](../../archive/2026-10-23-consolidate-sporeward-product-requirements/design.md) and [traceability ledger](../../archive/2026-10-23-consolidate-sporeward-product-requirements/traceability.md). Their relative targets were authored from the active change directory, then became one level too shallow when the directory moved under `archive/`.

## Goals / Non-Goals

**Goals:**

- Restore navigation from the two named archived documents to their existing local targets, including heading fragments.
- Verify those links from the archived files' actual locations.

**Non-Goals:**

- Rewrite the archived evidence, change its conclusions, or repair links in other files.
- Add a general repository-wide link policy or alter OpenSpec capability requirements.

## Decisions

- Resolve each local Markdown target relative to the archived source file, retaining its anchor and link label and adjusting only the path depth needed for resolution. This preserves historical wording and makes the links work in their current location; relocating the archive or converting every link to a repository-root URL would broaden the change.
- Validate only the two named files. Check that each local path exists and that any fragment names a heading or explicit anchor in its target. Use an existing checker if it accepts explicit paths; otherwise use a one-off scoped check rather than adding a general-purpose tool for this correction.
- Confirm the final diff is limited to link destinations in those two archived files. This protects historical prose and unrelated artifacts.

## Risks / Trade-offs

- [Risk] A path may resolve while its fragment is stale → [Mitigation] Check anchors as well as target-file existence for links in the two files.
- [Risk] A broad link check may fail on unrelated preexisting documents → [Mitigation] Keep validation input explicitly limited to the archived design and traceability ledger.

## Migration Plan

No migration is required. Correct the two sets of link destinations and run the scoped check from the archived file locations; rollback is limited to reverting those destination edits.
