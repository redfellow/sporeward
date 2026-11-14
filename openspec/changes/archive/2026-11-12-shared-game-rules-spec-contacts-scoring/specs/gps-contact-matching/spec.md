# Spec Delta

## ADDED Requirements

### Requirement: Valid ordered input and earliest contact
Contact matching SHALL reject fixes without timestamps, with timestamps not strictly increasing in time, or with non-finite or out-of-range coordinates. It SHALL return one earliest contact per outbreak even when several footprint versions match. Source: `packages/game/src/contacts.ts` (`matchContacts`); test: `packages/game/src/contacts.test.ts`.

#### Scenario: Unordered fixes
- **WHEN** a recording contains a fix earlier than its predecessor
- **THEN** matching fails instead of producing contacts

#### Scenario: Several footprint versions touched
- **WHEN** a route touches two successive footprint versions of one outbreak
- **THEN** only the earliest contact for that outbreak is returned
