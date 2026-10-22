# Outbreak recording field check

Sign in to your own tester account, record an outing, touch outbreaks and finish. **Finish saves the recording and queues upload automatically**. Failed uploads remain saved with a persistent retry notification. Your running score is provisional until the server validates the recording; later refreshes may confirm a cleanup bonus.

The field server now has 600 ordinary outbreaks across the urban Tampere riding region, extending into eastern Nokia, southern Ylöjärvi, western Kangasala and Lempäälä’s Säijä, Nurmi and Lempoinen areas. The map offers an orientation icon for north-up or track-up, plus a circular CENTER button after panning. Visit counts appear only at close zoom; tap an outbreak for details. Completed recordings are available under **Outings**, with recap and route views. The isolated replay world uses a separate deterministic 20-outbreak central Tampere baseline.

## Before heading out

1. Configure the development gateway separately from your personal tester account, then sign in under **Outings & setup → Tester account**. The field endpoint is HTTPS.
2. Confirm the map updates. The app refreshes approximately every 20 seconds while visible and caches the last validated world for offline recording.
3. For the original owner, use the explicit **Link earlier outings** confirmation once after signing in. Do not share the owner's account with other testers. See [Tester accounts](tester-accounts.md).
4. Select a route with an optional outbreak detour. The detail card shows available visit points, the locked cleanup bonus and visits remaining after already committed cleaning.

## During and after the outing

- Start/Pause/Resume/Finish are available on the recording map and persistent recording notification. Paused travel is excluded; resumed GPS starts another section.
- Use **Explore map** or pan to browse without automatic recentering. **Recenter**, **North up** and **Travel up** restore following. Travel bearing requires useful movement.
- Purple difficulty shades indicate remaining effort. Labels identify withering, clearing, stabilization and disintegration. Turquoise indicates touched during this outing; gray indicates unavailable. Remnants advertise their cleanup-only reward.
- At least 500 m of eligible GPS coverage is required for points. The HUD explains potential points held below this threshold. GPS gaps and paused travel do not invent connecting distance or contacts.
- Finish normally queues upload without a confirmation click. Check the recap's confirmed visit points, cleanup points and possible future cleanup bonus. A possible bonus is not earned yet: another visitor may become the finisher.
- Reopen the app after an interruption and check recovery, saved data and pending uploads. A session that expires offline retains recording ownership; sign in again to upload.

## Implemented rules

Contacts use timestamped GPS fixes, a 10 m boundary tolerance and interpolation only within the same recording section between fixes at most two seconds apart. Historical matching uses the outbreak geometry at the crossing time. The first contact per outbreak and activity is considered; overlapping sources may supply an earlier contact without duplicate awards. Activity validation enforces minimum distance and the 24-hour delivery window.

A first eligible ordinary visit earns 100 points. Six-hour per-player cooldowns and repeat-visit score/cleaning reductions use the shared balancing engine. Accepted visits apply 25% of cleaning over five minutes and 75% over twelve hours, on whole-minute server ticks. Delayed uploads start treatment when accepted and preserve the original visit time for eligibility. Cleanup bonuses remain locked; finishing/group/protection rules determine recipients. Remnants give their allocated cleanup bonus and no visit points.

PostgreSQL/PostGIS stores world state, changing footprint intervals, contributions and reward ownership transactionally. Retries and concurrent completions preserve contribution identity. The original owner's field data was migrated with a final quiesced backup and unchanged scores/contributions; see [Field migration](field-migration.md).

## Limits and next personal/group checks

This is a development world with provisional balance. Mapped access does not prove a route is safe or passable. Shapes grow and wither geographically, but full art/UI design, strategic splitting, live player sharing, support-squad presentation, Strava integration and final ranked leaderboards remain later work. Shared cleaning begins when the finished outing uploads; the current recorder does not stream live contacts to other players.

For the next substantial personal test, check screen-off GPS, folded/unfolded readability, notification pause/resume, short indoor GPS loss, automatic upload and preserved history after reopening. Compare with an independent watch recording where available. For a later group test, provision one invite per person, choose a shared outbreak plus separate detours, and compare independent recaps and named scores after all uploads, including one delayed upload and retry. Emulator replay supports routine development and does not establish outdoor GPS or battery reliability.
