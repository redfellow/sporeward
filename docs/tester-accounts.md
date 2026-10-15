# Tester accounts — development onboarding

The isolated PostGIS replay API now requires both the development gateway credentials and an individual tester session. Gateway credentials allow access to the test environment; the account session determines ownership of uploads, cooldowns and points. The shared field API has not yet switched to this account mode.

## Provision an invite

Using the intended private database connection, run:

```sh
node --env-file=work/replay/database.env --import tsx scripts/accounts/invite.mts --realm=native-living
```

The command saves a single-use, seven-day invite to a private file under ignored `work/replay/invites`. It prints the file path and expiry, not the code. Share the invite with the intended tester through your chosen private channel. Provisioning requires database access; the public account API cannot create invitations. Do not commit invite files or account credentials.

## Join or sign in on Android

1. Configure the development gateway connection under **Outings & setup → Test server**.
2. Under **Tester account**, select **Use an invite**, enter a username, display name, password and invite, then join. Existing testers use **Sign in**.
3. Record outings under that account. Account switching is disabled while an outing is unfinished.

Sessions are securely stored per API endpoint and last 30 days. Local recording identity remains associated with the tester while offline, including after session expiry; renewing the session is required to upload. Signing out revokes that session on the server and removes its local token. The current sign-out flow requires a working connection to confirm server revocation.

The disposable account used for real API verification is stored privately in `work/replay/emulator-account.json`; it is only for the isolated emulator world. It is not embedded in the APK or source.

## Remaining work

The Android account UI has not yet completed its assembled emulator sign-in/record/upload/switch check. Existing unassigned phone recordings remain preserved under the legacy local identity and require an explicit owner migration, alongside the server's historical contributions and upload storage. The shared field server remains unchanged until that migration is ready. Group score comparison and full small-group onboarding verification also remain in the active goal.

The account-owned native recorder/upload pipeline is verified using private replay bootstrap. Interactive form entry in the emulator still needs resolution. Run the reusable real-account group check with `node --env-file=work/replay/database.env --import tsx scripts/world/check-account-group.mts`: it provisions five disposable accounts in a unique realm, uses the same outing ID across them, retries uploads, delays one delivery by 30 minutes, advances cleaning and checks shared bonuses plus named scores. It cleans up only its own test realm and world.

## Link the existing owner explicitly

An administrator can bind an invite to the original server player identity:

```sh
node --env-file=work/replay/database.env --import tsx scripts/accounts/invite.mts --realm=native-living --legacy-owner=ORIGINAL_OWNER
```

Use the correct database/realm and original owner for the intended deployment. The invite's database record carries the binding; a registration request cannot choose or override it. A linked account has a new account ID but retains the original canonical gameplay player ID. Existing upload directories, contributions, cooldown history, bonus attribution and scores therefore remain in place, without reprocessing historical GPS or issuing awards again. Duplicate account claims for the same player are rejected.

On a phone signed into that linked account, **Link earlier outings** offers a separate confirmation to transfer unassigned local recordings. The transaction preserves GPS data, section timing, IDs and upload receipts, refuses an unfinished outing and leaves other accounts' recordings alone. It does not automatically claim recordings for the first account that signs in.

`node --env-file=work/replay/database.env --import tsx scripts/world/check-owner-link.mts` verifies the server binding, preserved contributions/cooldowns, readable legacy uploads, retry safety and rejection of client-chosen owner claims using an isolated disposable realm. Local transfer has a corresponding SQLite preservation check. No real field owner has been linked yet; field snapshot migration/deployment remains outstanding.

The Android tester board now displays confirmed scores, recognizable names and the current tester marker. Account switches recreate its view state. It is a simple test-world comparison, not the later monthly/yearly/country rankings.
