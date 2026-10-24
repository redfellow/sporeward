# Spec Delta

## MODIFIED Requirements

### Requirement: Personal marker overlay
Cooldown SHALL use a muted appearance. Contact during the current outing SHALL add a green border and centered check, preserving underlying lifecycle information. The check SHALL indicate contact rather than guarantee a points award.

#### Scenario: Contact an already unavailable target
- **WHEN** a player crosses an outbreak during this outing while on cooldown
- **THEN** the map records this outing's contact with a green marker without implying a new score award.

#### Scenario: Contact an outbreak in another lifecycle state
- **WHEN** a player contacts an outbreak during this outing while it is active, withering, disintegrating, clearing, splitting, or a remnant
- **THEN** its existing effort and lifecycle appearance remains visible beneath the green contact border and centered check.
