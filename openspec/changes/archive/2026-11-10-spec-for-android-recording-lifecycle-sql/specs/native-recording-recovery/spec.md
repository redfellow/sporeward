# Spec Delta

## ADDED Requirements

### Requirement: Resume after the missing permission is restored
After recovery paused an outing for missing background location permission, an explicit resume SHALL continue the same outing in a new section once the permission is granted. Test: `apps/mobile/src/recording/recovery.test.ts`.

#### Scenario: Permission granted later
- **WHEN** the player grants background location and resumes the paused outing
- **THEN** recording continues in the same outing with a new section
