# Spec Delta

## ADDED Requirements

### Requirement: Route shows GPS gaps apart from pauses
The Android route display SHALL draw a gap line where fixes within one section are more than two seconds apart, and SHALL start a new route line without a connector after a pause or interruption. Test: `apps/mobile/src/recording/model.test.ts`.

#### Scenario: Missing GPS inside a section
- **WHEN** two consecutive fixes in one section are more than two seconds apart
- **THEN** the route marks that stretch as a gap rather than as recorded route
