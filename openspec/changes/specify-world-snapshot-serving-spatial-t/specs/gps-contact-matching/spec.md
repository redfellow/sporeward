# Spec Delta

## ADDED Requirements

### Requirement: Archived and current footprints are merged for matching
When processing an eligible activity with database storage, the server SHALL match against archived footprint intervals overlapping the activity plus the transaction's current intervals, preferring the transaction's interval when both share an outbreak and start time.

#### Scenario: Snapshot holds only live outlines
- **WHEN** eligible recent GPS touches a shape kept only in the archive
- **THEN** the contact is matched from the archived interval

#### Scenario: Stale open archive interval
- **WHEN** catch-up has just closed an interval still open in the archive
- **THEN** matching uses the transaction's closed interval
