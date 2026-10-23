# Visit Scoring Specification

## Purpose

Define the established diminishing and recovery behavior for eligible ordinary visits scored under the legacy scoring version, so prospective awards remain predictable and confirmed awards retain their original value.

## Requirements

### Requirement: Legacy ordinary visit-point diminishing and recovery
Eligible ordinary visits scored under the legacy version SHALL use `base = max(minimum, floor(normal / 2^n))`, where `n` is the number of preceding accepted visits. After the configured delay, recover linearly from `base` to `normal` over the configured duration. Round the final value to the nearest integer, with half points upward. Current provisional values are 100 normal points, minimum 5, delay 72 hours, and duration 14 days.

#### Scenario: Repeat visit before recovery
- **WHEN** a player has one prior accepted visit to the same target and returns while the recovery delay has not elapsed
- **THEN** the eligible visit is worth 50 points from the 100-point normal value

#### Scenario: Recovery begins after the delay
- **WHEN** one prior accepted visit is followed by exactly 72 hours without another accepted visit
- **THEN** the next eligible visit remains worth 50 points

#### Scenario: Partial recovery
- **WHEN** one prior accepted visit is followed by 72 hours plus 7 days without another accepted visit
- **THEN** the next eligible visit is worth 75 points

#### Scenario: Full recovery
- **WHEN** one prior accepted visit is followed by 17 days without another accepted visit
- **THEN** the next eligible visit is worth 100 points

#### Scenario: Repeated visits reach the minimum
- **WHEN** repeated accepted visits reduce the unrecovered base below five points
- **THEN** the next eligible visit's unrecovered base is five points before recovery is applied

#### Scenario: Fractional result rounds to the nearest point
- **WHEN** the recovery calculation produces a value ending in one half point
- **THEN** the awarded legacy visit value rounds upward to the next whole point
