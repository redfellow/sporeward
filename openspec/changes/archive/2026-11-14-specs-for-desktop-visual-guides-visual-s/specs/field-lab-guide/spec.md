# Spec Delta

## ADDED Requirements

### Requirement: Distinct station poses
The shared survey station artwork SHALL keep transparent glow stops and distinct available and collected poses. Test: `packages/rendering/src/survey-station.test.ts`.

#### Scenario: Compare poses
- **WHEN** available and collected stations are drawn
- **THEN** their drawings differ and glow stays transparent at its edge
