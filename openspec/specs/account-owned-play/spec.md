# account-owned-play Specification

## Purpose

Define account attribution for accepted activity and resulting shared-world contributions. Live player presence, route visibility controls and protection areas remain open product scope and are not specified here.

## Requirements

### Requirement: Accepted activities belong to the authenticated account
An accepted uploaded activity and its resulting visits, contributions and personal score SHALL be attributed to the authenticated account that submitted it. Client-supplied identity SHALL NOT reassign ownership.

#### Scenario: Submit while signed in
- **WHEN** an authenticated account submits an otherwise accepted activity
- **THEN** its activity history and resulting personal awards belong to that account and are not exposed as another account's activity by account switching.
