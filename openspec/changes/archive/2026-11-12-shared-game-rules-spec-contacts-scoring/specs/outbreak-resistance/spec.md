# Spec Delta

## ADDED Requirements

### Requirement: Current versioned resistance parameters
Rules version 1 SHALL decay resistance with a 7-day half-life and apply one reward curve with a soft threshold at half reward and a 25% floor. Invalid numerical inputs SHALL be rejected. Contributions with the same identity SHALL count once regardless of delivery order. Source: `packages/game/src/resistance.ts` (`RESISTANCE_RULES`); test: `packages/game/src/resistance.test.ts`.

#### Scenario: Deliveries arrive out of order
- **WHEN** the same contributions are committed in different orders or serialized through JSON
- **THEN** the resulting resistance is identical

### Requirement: Neutral activation without backfill
Server resistance SHALL start neutral when enabled and SHALL NOT backfill uploads accepted before activation. It SHALL keep state across rollback and reactivation. Late uploads in either order SHALL NOT rewrite confirmed awards or replay resistance. Test: `apps/server/src/resistance-state.test.ts`.

#### Scenario: Old uploads before activation
- **WHEN** resistance is activated on a server with earlier accepted uploads
- **THEN** those uploads add no resistance

### Requirement: Account-isolated resistance
Personal resistance events and awards SHALL be stored per hashed account and persisted atomically across concurrent retries and restarts. Map offers SHALL use only the authenticated owner, never an account chosen by query input. Test: `apps/server/src/resistance-state.test.ts`.

#### Scenario: Query names another account
- **WHEN** a request supplies another player's identity in its query
- **THEN** offers, awards and recaps reflect only the authenticated owner
