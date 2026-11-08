# Spec Delta

## ADDED Requirements

### Requirement: Deterministic lab spawning
Rules version 1 SHALL spawn two labs per 7-day epoch. Each SHALL sit on an accessible cell with a public way, the two at least 2 km apart. Placement SHALL be determined by world seed and epoch and SHALL be identical for every account. Labs from earlier epochs SHALL remain matchable. Source: `apps/server/src/field-labs.ts`; test: `apps/server/src/field-labs.test.ts`.

#### Scenario: Two accounts view the same epoch
- **WHEN** two accounts load the world during one epoch
- **THEN** both see the same two labs with identical positions and expiry

### Requirement: Frozen per-outing offer
The server SHALL issue at most one offer per player and outing, valid for 24 hours. It SHALL cover the player's uncollected unexpired labs, with distances from the reference centre at issue time. Requesting it again SHALL return the same offer. The offer SHALL be unavailable when resistance or labs are disabled. Source: `apps/server/src/lab-settlement.ts` (`issueLabOffer`); test: `apps/server/src/lab-settlement.test.ts`.

#### Scenario: Request again after travelling
- **WHEN** a player requests the outing's offer again closer to a lab
- **THEN** the original offer is returned unchanged

### Requirement: Contact-time settlement
Settlement SHALL mark a lab contact as one of:
- ineligible, when the track is ineligible or the contact precedes resistance activation;
- expired, when the contact falls outside the lab's lifetime;
- already collected, when the player has collected it before.

Otherwise the contact SHALL be confirmed. A valid matching offer SHALL settle as quoted. Without one, the server SHALL settle a reconciled amount, capped by shared settlement load and available resistance. Ordinary and lab contacts SHALL be applied in recorded-time order. Source: `apps/server/src/lab-settlement.ts` (`settleLabContact`); test: `apps/server/src/lab-settlement.test.ts`.

#### Scenario: Offline collection without a cached offer
- **WHEN** an eligible upload contacts an unexpired lab with no valid offer for the outing
- **THEN** the result is confirmed as reconciled rather than a guaranteed quoted amount

#### Scenario: Lab before an ordinary contact
- **WHEN** an outing contacts a lab and later an ordinary outbreak
- **THEN** the restoration applies before pricing the later ordinary visit
