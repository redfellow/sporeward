# account-owned-play Specification

## Purpose

Define account attribution for accepted activity and resulting shared-world contributions. Live player presence, route visibility controls and protection areas remain open product scope and are not specified here.

## Requirements

### Requirement: Accepted activities belong to the authenticated account
An accepted uploaded activity and its resulting visits, contributions and personal score SHALL be attributed to the authenticated account that submitted it. Client-supplied identity SHALL NOT reassign ownership.

#### Scenario: Submit while signed in
- **WHEN** an authenticated account submits an otherwise accepted activity
- **THEN** its activity history and resulting personal awards belong to that account and are not exposed as another account's activity by account switching.

### Requirement: Invite-only tester registration
A tester account SHALL be created only with an unexpired, unused invite of the server's account realm, with a 3–40 character lowercase username, a display name of at most 80 characters and a 12–256 character password. Each invite SHALL be usable once. The public API SHALL NOT create invites. Source: `apps/server/src/accounts/store.ts` (`register`, `invite`).

#### Scenario: Reuse an invite
- **WHEN** a second registration presents an invite that has already been used or has expired
- **THEN** registration is rejected with a 400 response and no account is created

### Requirement: Password sign-in issues an expiring session
Signing in with a valid username and password SHALL return a session token valid for 30 days and the tester profile. Invalid credentials SHALL receive a 401 response without revealing whether the username exists. Source: `apps/server/src/accounts/store.ts` (`login`); test: `apps/server/src/accounts/api.test.ts`.

#### Scenario: Wrong password
- **WHEN** a tester signs in with an incorrect password
- **THEN** the server responds 401 with a generic invalid username or password message

### Requirement: Account mode requires a tester session
When accounts are enabled, every route except health, sign-in and registration SHALL require a valid session in the `x-sporeward-session` header in addition to any gateway credentials. Gateway credentials alone SHALL NOT act as a player. Test: `apps/server/src/accounts/api.test.ts`.

#### Scenario: Gateway credentials without a session
- **WHEN** a request carries valid gateway credentials but no tester session
- **THEN** the world, scores and upload routes respond 401

### Requirement: Sign-out revokes the session
Signing out SHALL revoke that session on the server so later requests with its token are rejected, without affecting other testers' sessions. Test: `apps/server/src/accounts/api.test.ts`.

#### Scenario: Use a token after sign-out
- **WHEN** a tester signs out and then requests the world with the same token
- **THEN** the server responds 401 while another tester's session continues to work

### Requirement: Invite-bound legacy owner linking
An invite MAY bind the new account to an existing gameplay player identity; the account SHALL then act as that player for uploads, cooldowns and scores. The binding SHALL come only from the invite record, and a player identity SHALL be linked to at most one account per realm. Source: `apps/server/src/accounts/store.ts`; `docs/tester-accounts.md`.

#### Scenario: Claim an already linked player
- **WHEN** a second invite bound to the same legacy player is redeemed
- **THEN** registration is rejected and the existing link is unchanged

### Requirement: Uploads are stored per account
Activity uploads SHALL be stored under the authenticated account's player identity, so two accounts uploading the same activity ID keep separate data and one account cannot complete another's upload. Tests: `apps/server/src/accounts/api.test.ts`, `apps/server/src/activity-store.test.ts`.

#### Scenario: Same activity ID from two accounts
- **WHEN** two testers upload different fixes under the same activity ID
- **THEN** each account's stored activity contains only its own fixes

### Requirement: Tester score board
An authenticated tester SHALL be able to read a score board of up to 50 entries ranked by confirmed points, listing only players with a profile in the server's realm, each with rank, account ID, display name, username and points. Tests: `apps/server/src/accounts/api.test.ts`; source: `packages/protocol/src/scores.ts`.

#### Scenario: Scores include an outside player
- **WHEN** standings contain a player without an account in this realm
- **THEN** that player is omitted and the remaining testers are ranked from 1 by points
