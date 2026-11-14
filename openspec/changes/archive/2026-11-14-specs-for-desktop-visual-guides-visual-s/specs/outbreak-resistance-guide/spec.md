# Spec Delta

## ADDED Requirements

### Requirement: Transparent resistance boundary
The resistance field artwork SHALL fade to transparent at its boundary and keep its contours inside the field. Test: `packages/rendering/src/survey-station.test.ts`.

#### Scenario: Inspect the field edge
- **WHEN** the resistance field is drawn
- **THEN** its outermost stop is transparent and no contour extends past the boundary
