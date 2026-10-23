## ADDED Requirements

### Requirement: Spatial ordinary reward evaluation
Resistance-based ordinary visit pricing SHALL weight the player's applicable cleaning contributions by proximity to the evaluated target. Global lab restoration SHALL reduce accumulated contribution resistance without making resistance uniform everywhere. The displayed centre SHALL NOT substitute for local evaluation of the contribution geography.

#### Scenario: Compare local and distant visits
- **WHEN** two eligible targets have different proximity to the player's accumulated cleaning contributions
- **THEN** their resistance reductions are evaluated locally rather than using one identical global resistance value.

#### Scenario: Restore a concentrated footprint
- **WHEN** lab restoration reduces contributions concentrated around the player's usual cleaning area
- **THEN** resistance-based point loss is reduced where those contributions carry spatial weight, subject to subsequent play, elapsed time and reward rounding.

### Requirement: Gradually responsive resistance centre
The established presentation centre SHALL be able to follow changes in the concentration of recent accepted cleaning gradually. Cleaning during adventures SHALL contribute to this geography under the ordinary contribution rules. Travelling without accepted cleaning SHALL NOT add resistance contributions.

#### Scenario: Clean along an adventure
- **WHEN** accepted cleaning along an adventure changes the concentration of recent contributions toward that area
- **THEN** the summary centre can gradually shift in that direction while local reward evaluation continues to use spatial contributions and an existing outing's lab offer retains its frozen reference.
