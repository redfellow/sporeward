# Spec Delta

## ADDED Requirements

### Requirement: Desktop lab shares one contact footprint
The desktop rendering lab SHALL derive outbreak footprints that exclude mapped water (keeping islands as land) and neighbouring outbreaks, and SHALL use the same footprint for drawing and for contacts from replayed timestamped fixes. Footprints SHALL be deterministic per seed. Test: `apps/web/src/rendering/footprint.test.ts`.

#### Scenario: Replay across the lake shore
- **WHEN** the lab replays fixes near Iidesjärvi
- **THEN** contacts occur only where the drawn footprint lies on land
