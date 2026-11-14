# Spec Delta

## ADDED Requirements

### Requirement: Personal foreground contact notices
During foreground recording on the live map, a newly observed personal outbreak or Field Lab contact SHALL produce a brief non-blocking notice identifying the contact and its provisional reward context. Notices SHALL use recorded contact evidence, never mere proximity, destination pinning or a world transition caused by another player. Paused outings and historical maps SHALL NOT produce fresh contact celebrations.

#### Scenario: Reach an outbreak while recording
- **WHEN** a new recorded contact is observed during foreground live-map recording
- **THEN** a brief notice identifies the outbreak and labels any local visit-point estimate as awaiting server validation

#### Scenario: Another player clears an outbreak
- **WHEN** the received world reports a clearance without new personal contact evidence
- **THEN** the app does not announce a personal visit or award from that change

### Requirement: Evidence-aware contact wording
Contact feedback SHALL distinguish estimated visit points, points held until the minimum outing distance qualifies, and confirmed outcomes. A known local cooldown SHALL explain the lack of estimated visit points; unknown zero estimates SHALL NOT be labelled cooldown without evidence. Lab contact SHALL remain provisional until authoritative collection. Possible cleanup or offered restoration SHALL NOT be presented as earned.

#### Scenario: Contact before the outing qualifies
- **WHEN** contact evidence has a visit-point estimate but recorded eligible distance is below the existing minimum
- **THEN** feedback explains that the estimate is held until the outing qualifies and still needs server validation

#### Scenario: Record a Field Lab contact
- **WHEN** a lab contact exists without an authoritative collection result
- **THEN** feedback says collection is provisional and does not claim restored resistance or a guaranteed restoration amount

#### Scenario: Recover an older zero-point observation
- **WHEN** a saved zero-point contact has no reliable local eligibility reason
- **THEN** its log entry states that no visit points were estimated without inventing a cooldown reason

### Requirement: Recoverable current-outing contact log
A recording or paused outing SHALL offer a scrollable Recent contacts log containing known outbreak and Field Lab contacts, target identity, original contact time and reward/validation context, newest first. Known entries SHALL survive navigation and app restart, including after a target disappears from the current snapshot. One entry per target SHALL summarize the outing's evidence; it SHALL NOT redefine eligible visits or scoring.

#### Scenario: Return after screen-off recording
- **WHEN** saved fixes or existing observations reveal contacts recorded while the app was not visible
- **THEN** known contacts appear in Recent contacts at their recorded times, without replaying a series of old banners

#### Scenario: Target leaves the map
- **WHEN** an observed target is absent from a later world snapshot
- **THEN** its saved contact entry remains available as historical observation rather than a current destination or guaranteed reward

### Requirement: Deduplicated and bounded celebrations
Repeated fixes, world refreshes, remounts, restored data or updated validation SHALL NOT repeat a target's contact celebration in the same outing. Rapid new contacts SHALL be grouped into bounded feedback while retaining individual log entries. Contacts recovered through startup, foreground catch-up or delayed world loading SHALL enter the log silently instead of being presented as fresh live contacts.

#### Scenario: Reopen the app mid-outing
- **WHEN** an ongoing outing and its previously known contacts are restored
- **THEN** the log returns and those contacts do not celebrate again

#### Scenario: Several targets are crossed rapidly
- **WHEN** several distinct new targets are observed in quick succession
- **THEN** bounded grouped feedback replaces a long banner queue and each target remains individually inspectable in the log

### Requirement: Contact-log outcome reconciliation
When an authoritative result for the same owned outing is available, the log SHALL update the matching contact entry with its confirmed or rejected outcome, without another contact celebration or independent point accounting. Unknown, pending and confirmed values SHALL stay distinct. Newer map eligibility alone SHALL NOT rewrite an earlier contact's stored estimate or establish its final outcome.

#### Scenario: A provisional contact is rejected
- **WHEN** the received outing result rejects a previously logged contact for cooldown
- **THEN** the entry explains that outcome, and does not retain its earlier estimate as confirmed points

### Requirement: Non-disruptive contact presentation
Banners and Recent contacts SHALL preserve map camera, destination pin, recording and upload behavior. The log SHALL close on Close or Android Back before map-level navigation and keep pause/finish controls accessible on narrow and wide layouts. Banners SHALL NOT overlap open target details, Nearby, the contact log or existing cleanup feedback; suppressed contact notices SHALL remain available in the log.

#### Scenario: A contact arrives while Nearby is open
- **WHEN** new contact evidence arrives while another map sheet or target card occupies the feedback area
- **THEN** the contact is retained in the log without obscuring that UI or queuing a delayed celebration

#### Scenario: Review contacts while paused
- **WHEN** the player opens Recent contacts in a paused outing and presses Android Back
- **THEN** the log closes, the same map and pin return, and the outing remains paused

### Requirement: Outing and identity isolation
Contact feedback SHALL belong to its recording owner, outing and world/environment context. Switching or resetting those contexts SHALL clear visible feedback and queued notices without deleting saved recordings. Feedback SHALL NOT leak into another account, a new outing or historical recap navigation. When no contact evidence is available, it SHALL explain that absence rather than invent events or rewards.

#### Scenario: Begin another outing
- **WHEN** a new outing starts after a previous outing finishes
- **THEN** its Recent contacts and live notices start independently of the previous outing's entries

#### Scenario: Cached world is unavailable
- **WHEN** recorded fixes exist but no usable contact evidence or world is available to match them
- **THEN** the log explains that contact information is unavailable and does not imply the recording failed or invent contacts
