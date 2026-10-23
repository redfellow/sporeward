# outbreak-growth Specification

## Purpose

Defines the provisional growth, proportional cleaning requirement, and lifetime-extension behavior of ordinary geographic outbreaks.

## Requirements

### Requirement: Proportional footprint growth and cleaning requirement
An untreated ordinary outbreak SHALL grow toward its configured footprint cap during its growth interval when accessible, unoccupied ground is available. Its required cleaning strength SHALL increase in proportion to newly occupied footprint, while already committed cleaning remains credited. Current defaults are provisional: five initial cells, ten maximum cells, and four days to maximum growth.

#### Scenario: Untreated outbreak grows into available ground
- **WHEN** an ordinary outbreak remains untreated through its configured growth interval and enough accessible unoccupied ground is available
- **THEN** its footprint grows from the provisional five-cell starting size toward the provisional ten-cell cap, and its required cleaning strength grows in proportion to the footprint without increasing its locked cleanup bonus

#### Scenario: Growth is constrained by surrounding outbreaks or access
- **WHEN** nearby accessible ground is occupied or unavailable
- **THEN** the outbreak does not claim another outbreak's footprint or inaccessible ground, and its footprint remains within the available geographic boundary

### Requirement: Cleaning pauses growth and preserves progress
While accepted cleaning treatment is active, an ordinary outbreak SHALL NOT expand. Treatment reduces its remaining cleaning requirement over time, and its footprint SHALL shrink to reflect that remaining requirement without erasing previously committed cleaning.

#### Scenario: Treatment is active during the growth interval
- **WHEN** an outbreak has pending cleaning treatment
- **THEN** it withers rather than grows, and its remaining footprint and cleaning requirement reflect treatment delivered so far

#### Scenario: Treatment completes before the outbreak is cleared
- **WHEN** all pending treatment finishes while cleaning requirement remains
- **THEN** the surviving outbreak resumes growth under its existing lifecycle timeline and retains the cleaning already delivered

### Requirement: Proportional and capped lifetime extension
An accepted eligible visit SHALL extend an ordinary outbreak's deadline in proportion to its ordinary repeat-visit point value relative to the full-value visit. Current defaults are provisional: two hours for a full-value visit and at most twenty-four hours of total extension per outbreak. Growth SHALL NOT increase the locked cleanup bonus.

#### Scenario: Full-value and reduced-value visits extend lifetime
- **WHEN** an accepted full-value visit and an accepted visit worth half as many ordinary repeat points are applied under the same rules version
- **THEN** the full-value visit extends the deadline by the provisional two-hour amount and the reduced-value visit extends it by half that amount, subject to the shared cap

#### Scenario: Lifetime extension reaches its cap
- **WHEN** further accepted visits would extend the deadline beyond the provisional twenty-four-hour total extension allowance
- **THEN** the deadline does not move beyond that allowance

### Requirement: Growth and disintegration use one provisional lifecycle
An ordinary outbreak SHALL grow during its configured growth interval, then enter its configured disintegration countdown unless it has been cleared. Current defaults are provisional: four days for growth followed by a twenty-four-hour disintegration countdown. Accepted visit extensions move the deadline and countdown together within the lifetime-extension cap.

#### Scenario: Growth reaches the disintegration phase
- **WHEN** an ordinary outbreak reaches the end of its growth interval without being cleared
- **THEN** it enters the announced disintegration countdown, during which accepted cleaning remains available under the ordinary visit rules

#### Scenario: An accepted visit postpones disintegration
- **WHEN** an accepted visit extends an outbreak's deadline before or during the countdown
- **THEN** the displayed disintegration timing moves by that extension, subject to the total allowance
