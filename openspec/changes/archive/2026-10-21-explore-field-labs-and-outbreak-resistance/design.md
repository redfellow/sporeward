# Design

## Context

See [proposal.md](proposal.md) for motivation. The desktop field guide is `apps/web/src/rendering/PaletteStudy.tsx`; its accepted ordinary-outbreak baseline is `754a5c1`. The separate [Android visual-port change](../../replicate-approved-visuals-and-showcase/design.md) remains in progress. This design is needed to separate visual simulation from future authoritative gameplay and preserve decisions from the exploration.

## Goals / Non-Goals

**Goals:** Review the new destination and personal overlay in the existing guide, communicate restoration visibly, and preserve the gameplay direction without pretending it is implemented.

**Non-Goals:** Authoritative resistance calculations, spawning, collection persistence, score changes, migrations, Android integration, achievements or a final balancing model.

## Decisions

### Visual implementation

1. Extend the existing guide with isolated illustrative state and explicit reset, rather than adding a gameplay endpoint. Compare labs, ordinary Richer growth and resistance together on one full-width scene using the bundled Tampere OSM snapshot. Keep collection and balancing controls below the map; map positions and distance-slider offers are independent illustrative fixtures, not a georeferenced lab-distance claim. Preserve existing guide examples and their accepted appearance.
2. Field Lab is a fictional survey station: compact tripod, luminous sample chamber and subtle scanning ring. Available and collected states differ through motion, brightness and a personal check, not colour alone. Owner refinement: a collected station retains its position but has an empty, dark chamber, a dimmed body and one slightly slumped support; no falling/physics animation. Other players see the intact, available station. Use code/vector geometry consistent with the current guide; no new bitmap generation is required by this plan.
3. Render resistance as a broad circular falloff, using soft muted blue haze (owner-selected hue 227°) and restrained lavender contours that become clearer at higher resistance. Very slight contour irregularity is visual only; the illustrative influence remains strongest at the centre and fades radially. A subdued green is a palette fallback if the first treatment does not sit well on the map. Avoid obscuring street labels, ordinary effort/lifecycle colours or contact indicators. Preview collection by weakening the same zone, not removing an arbitrarily selected neighbourhood.
4. Keep demonstration calculations small, explicit and deterministic. Clearly label illustrative parameters; provide collection-name cycling, player switching, passive-time/local-cleaning controls and distance/repeat comparison. These controls are visual fixtures, not a candidate production engine hidden in the UI.
5. Keep reusable visual geometry platform-neutral where useful, without imposing a shared-renderer refactor on the other active change. No new live API dependency. Android camera alignment and performance are unaffected because Android is not changed.

### Agreed future gameplay direction — not implemented by this change

- Product priorities: encourage longer A-to-B cycling and unfamiliar destinations; encourage otherwise-unplanned outings; then scores and competition. Achievements are an idea, not a defined feature.
- Repeated local cleaning builds personal Outbreak Resistance, carried across replacement outbreaks so the same commute does not become fresh solely through respawning. Local point opportunities decline; nearby short walks must remain worthwhile. Exact accumulation accounting and reward floor are not settled.
- Resistance recovers naturally. Shared Field Labs provide the active adventure reward; ordinary distant contributions do not need a separate restoration system in the selected model.
- Restoration reduces accumulated resistance globally. It is not a temporary buff, stockpile or permanent exploration unlock.
- Labs are uncommon, longer-lived destinations relative to ordinary outbreaks; spawn rates and lifetimes are unresolved. Each player collects a lab once. It stays visible and disabled for that player until expiry, while remaining independently collectible by others.
- Restoration scales with distance from an established personal resistance centre, rises gradually and plateaus. Freeze the advertised offer during an outing. Successive collections give diminishing restoration, whose effectiveness recovers gradually; no fixed calendar-week reset is agreed.
- Balance toward five commuting days plus a rewarding weekend expedition: one worthwhile excursion noticeably improves the following week, while repeated long-distance collections do not guarantee permanently capped effectiveness. Alternating two token destinations must not bypass repetition costs. The mechanism and parameters still require simulation.
- The map target is Field Lab. Its reward uses the ten-name pool in [field-lab-guide](specs/field-lab-guide/spec.md); names are flavour, not ten distinct item mechanics. Outbreak Resistance is the chosen player-facing effect name.

### Proposed defaults, not confirmed mechanics

- Begin centre experiments with the strongest concentration of recent cleaning, with stable movement. Compare against the user's cleaning-weighted coordinate-average suggestion using representative routes, including separated clusters. Do not assume the average is unsuitable or lock either algorithm into production.
- Keep cleaning strength unchanged while experimenting with point resistance. This was recommended, but not explicitly settled as a gameplay rule.
- Longer hard cooldowns were discussed as an alternative, not selected for implementation. Do not silently change the existing six-hour cooldown.

## Risks / Trade-offs

- A beautiful preview could imply implemented mechanics → label it illustrative; later gameplay work needs its own requirements, balancing simulation and tasks before production changes.
- A moving centre could change advertised rewards or place resistance away from actual play → use an established fixture centre here; compare centre models before engine implementation.
- Shared labs could favour very high mileage or a repeat two-stop route → retain capped distance scaling and diminishing restoration in the preview; validate full weekly scenarios later.
- Overlay clutter or confusing rewards → inspect bright/night maps, explain personal resistance separately from outbreak effort, and show the offered restoration before collection.

## Migration Plan

No data migration or deployment. Implement and review the web guide independently, then retain or revise the visuals based on owner feedback. Preserve the other active change and existing user edits. Future gameplay work must reconcile concept/player rules and add authoritative contracts before engine implementation; future Android work must retain native MapLibre alignment.

## Open Questions

Deferred to gameplay planning, without blocking this illustrative guide: accumulation basis (contacts, cleaning or earned points), point floor, centre algorithm and history horizon, zone radius, resistance decay, distance curve/cap, collection diminishing/recovery timing, lab placement/lifetime, repeated-area safeguards, and offer-freezing rules under account changes or long outings. Ten kilometres was an excursion example, not an agreed threshold. Visual colours and subtle animation timing remain subject to owner review.
