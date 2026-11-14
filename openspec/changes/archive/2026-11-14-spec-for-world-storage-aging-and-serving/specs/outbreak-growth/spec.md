# Spec Delta

## ADDED Requirements

### Requirement: Outbreaks keep separation from neighbours
Growth, replacement and remnant placement SHALL NOT claim another live or protected outbreak's cells or contour interior.

#### Scenario: Growth beside a neighbour
- **WHEN** an outbreak grows next to an occupied neighbour
- **THEN** it grows around the neighbour without claiming its cell or merging contours

### Requirement: Ordinary density is replenished independently of remnants
The spatial world SHALL spawn replacement ordinary outbreaks toward its configured density after the configured delay, without counting remnants toward that density.

#### Scenario: Parent disintegrates
- **WHEN** an ordinary outbreak disintegrates into remnants
- **THEN** remnants keep the parent identity and replacements restore ordinary density separately
