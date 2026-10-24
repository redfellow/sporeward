# Sporeward — Player guide

Sporeward makes an outdoor walk, run or ride a chance to help clean a shared outbreak world. This guide describes the implemented native-recording MVP slice. Some mechanics, including Field Labs and Outbreak Resistance, are opt-in in the test world; the [roadmap](development-roadmap.md) tracks device, field and production acceptance separately.

In the Android app, tap **?** on the map to open the offline **Field guide**: a short introduction, illustrated outbreak states, and Field Lab/Resistance explanations. The guide can be read during an outing without pausing the recorder; **Back to map** or Android back closes it. Phone visual acceptance is tracked separately in the [native guide change](../openspec/changes/add-native-field-guide/tasks.md).

## Take part

1. Open the Android app and inspect nearby outbreaks and any available Field Labs.
2. Record an outing with Sporeward's native recorder. Pause and resume to preserve separate route sections, then submit the activity.
3. The server validates recorded contacts and confirms eligible points and cleaning. Map feedback during an offline outing may use the last available world data, so results remain provisional until validation.
4. Review the recap for confirmed points, outbreak contacts, cleaning and any Field Lab result. A possible cleanup bonus stays separate until the server awards it.

Strava activities and expanded monthly, yearly, global or country rankings are not part of MVP. The web page is currently a rendering study rather than the complete playable browser experience.

## Visits and rewards

An accepted visit comes from timestamped location evidence within a target's contact area. A crossing can be inferred only across a short gap in the same recorded section; uncertain contacts are ignored while other valid contacts can still count. The [GPS contact specification](../openspec/specs/gps-contact-matching/spec.md) owns the contact boundary and evidence rules.

Eligibility, repeat points and cooldowns belong to the [visit-scoring capability](../openspec/specs/visit-scoring/spec.md). A visit can earn personal points and contribute cleaning. Existing treatment and other riders can affect how quickly an outbreak clears. A cleanup bonus is conditional until confirmed, and a later award updates the outing recap. See the [Field Labs](../openspec/specs/field-labs/spec.md), [Outbreak Resistance](../openspec/specs/outbreak-resistance/spec.md), and [outing feedback](../openspec/specs/outing-feedback/spec.md) capabilities for their owned rules.

Field Labs are shared destinations that each player can collect independently. Where resistance is enabled, collecting a lab can reduce that player's accumulated resistance; it does not grant an inventory item or guarantee a full reset. Exact offers and balancing values remain configuration-dependent. The [renewable exploration capability](../openspec/specs/renewable-exploration/spec.md) owns the approved exploration and recovery experience.

## Current limits

Account attribution applies to accepted uploaded activities and their results. It does not imply live location sharing, route visibility controls, protection areas, or group privacy features. Ordinary server worlds do not currently activate strategic outbreak splitting. These subjects require separate decisions and are not rules in this guide.

Automated checks and synthetic replay demonstrate only their recorded scenarios. They do not establish reliable screen-off GPS on every device, outdoor acceptance, public service operation, or deferred integration behavior. See the [finished-goals record](finished-goals.md) for dated evidence and the [architecture](architecture.md) for system boundaries.
