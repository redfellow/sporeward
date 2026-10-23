# gps-contact-matching Specification

## Purpose

Defines how timestamped GPS recordings establish outbreak contacts, including geometric tolerance and selection of historical outbreak footprints.

## Requirements

### Requirement: Geometric contact evidence
The system SHALL match recorded fixes against the outbreak footprint valid at the fix time, using a 10 metre tolerance around its boundary. It SHALL infer a crossing only between consecutive fixes in the same recorded segment when their timestamps are no more than 2 seconds apart.

#### Scenario: Observed fix at the boundary
- **WHEN** a timestamped fix is inside an outbreak footprint or no more than 10 metres outside its boundary
- **THEN** the fix establishes contact at its recorded timestamp

#### Scenario: Short same-segment crossing
- **WHEN** consecutive fixes in one recorded segment are no more than 2 seconds apart and their connecting path enters the footprint or its 10 metre boundary tolerance
- **THEN** the inferred first contact time is recorded

#### Scenario: Gap or segment boundary
- **WHEN** consecutive fixes are more than 2 seconds apart or belong to different recorded segments
- **THEN** the system does not infer contact from the path between them, while a directly observed fix can still establish contact

### Requirement: Fix accuracy is informational
Reported horizontal accuracy SHALL NOT reject a geometrically valid contact or expand the contact boundary. No accuracy threshold is applied to contact acceptance.

#### Scenario: Accurate coordinate outside tolerance
- **WHEN** a fix's reported accuracy overlaps an outbreak but its coordinate is more than 10 metres outside the boundary
- **THEN** the fix does not establish contact

#### Scenario: Low reported accuracy at a qualifying coordinate
- **WHEN** a fix coordinate establishes contact under the geometric rule regardless of its reported accuracy value
- **THEN** the fix establishes contact

### Requirement: Historical footprint matching
The system SHALL evaluate each recorded contact time against the footprint version whose validity interval contains that time, with the start inclusive and the end exclusive. Historical footprint geometry SHALL remain available for eligible recorded activities that overlap its interval.

#### Scenario: Contact against a replaced footprint
- **WHEN** an eligible recorded activity touches an outbreak's former footprint during that footprint's validity interval
- **THEN** the historical contact is matched against that former footprint even if the outbreak has a different current footprint

#### Scenario: Footprint version boundary
- **WHEN** a fix timestamp equals a footprint's start time or end time
- **THEN** the start time belongs to that footprint and the end time does not

#### Scenario: Inferred contact rounds to a footprint boundary
- **WHEN** an inferred first-contact timestamp for a former footprint rounds up to that footprint's exclusive end
- **THEN** the former footprint does not receive the contact, and the footprint beginning at that boundary may match it from its inclusive start
