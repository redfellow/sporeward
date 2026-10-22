# Spec Delta

## Purpose

Give players a consistent visual language for outbreak effort, lifecycle and personal contact status across the guide and the Android map.

## ADDED Requirements

### Requirement: Approved visual language
The web guide and Android map SHALL use the accepted Ember & violet visual language from commit `754a5c1`, with warm effort colours, distinct violet remnants, pale clearing, and centered circular state badges.

#### Scenario: Compare an example across platforms
- **WHEN** the same outbreak state is displayed in the guide and Android map
- **THEN** its palette, silhouette treatment, membranes and badge communicate the same state.

### Requirement: Effort colour and gradual footprint
The presentation SHALL distinguish current footprint size from remaining effort after committed cleaning. It SHALL retain the distinct clearing appearance when committed treatment suffices to finish the outbreak.

#### Scenario: Treatment is committed before shrinkage completes
- **WHEN** a large outbreak has enough pending cleaning to reduce its remaining effort
- **THEN** its colour reflects the reduced effort while its footprint follows gradual cleaning rather than immediately jumping size.

### Requirement: Lifecycle-specific material and motion
Withering SHALL show slower trembling and explicit rim dots. Disintegrating SHALL show angular irregular membranes over tapered branching lightning. Cracks forming SHALL show a narrow angular fissure spanning the footprint edge-to-edge, with tapered forks and all crack geometry clipped to the outbreak; Splitting SHALL show complementary irregular halves with a jagged zipper gap. Remnants SHALL have a rounded core and satellite droplets.

#### Scenario: Distinguish crack and split
- **WHEN** a forming crack transitions into splitting
- **THEN** the edge-to-edge, tapered branching fissure becomes a distinct zipper gap between two related growth shapes; no forming-crack stroke extends beyond the outbreak boundary.

#### Scenario: Distinguish cleaning states
- **WHEN** withering and clearing examples are viewed together
- **THEN** withering has a dotted rim and trembling membranes while clearing has a pale, softly irregular body and wider halo.

### Requirement: Personal marker overlay
Cooldown SHALL use a muted appearance. Contact during the current outing SHALL add a green border and centered check, preserving underlying lifecycle information. The check SHALL indicate contact rather than guarantee a points award.

#### Scenario: Contact an already unavailable target
- **WHEN** a player crosses an outbreak during this outing while on cooldown
- **THEN** the map records this outing's contact with a green marker without implying a new score award.

### Requirement: Stable camera alignment and bounded animation
Android outbreak bodies, membranes, gaps and badges SHALL remain attached to the same geographic position during pan, zoom and rotation. Animation SHALL be bounded to nearby foreground content and respect reduced motion.

#### Scenario: Fast map pan
- **WHEN** the player pans or zooms the map rapidly
- **THEN** every outbreak layer follows the native map camera without trailing independently.

#### Scenario: Reduced motion or background
- **WHEN** reduced motion is enabled or the application leaves the foreground
- **THEN** unnecessary membrane animation stops while a readable static appearance remains available when appropriate.

### Requirement: Progressive map overview
Android SHALL replace detailed outbreak artwork progressively with simplified coloured bodies and state badges, small individual badges where space permits, and spatial summaries where destinations would overlap. Selecting a summary SHALL zoom into its contents. Summary totals SHALL use the full received world independently of near-detail culling.

#### Scenario: Inspect a dense region from far away
- **WHEN** multiple outbreak and lab markers would overlap at overview zoom
- **THEN** the map shows grouped counts and state colours, with a tap to explore the grouped area rather than a pile of overlapping individual icons.

#### Scenario: Return to riding zoom
- **WHEN** the player zooms into a grouped area
- **THEN** summaries separate into small native badges, then simplified coloured shapes, then detailed geographic artwork with its state badge.


### Requirement: Consistent distant Field Lab badge
Distant Field Labs SHALL use a dish/antenna badge in the same circular vector style as outbreak badges, retaining a non-colour personal collected cue.

#### Scenario: Identify a lab at overview zoom
- **WHEN** a lab is represented individually rather than within an area summary
- **THEN** it has a readable antenna badge instead of a tiny station illustration or LAB text badge.

### Requirement: Area summary contents
Area summaries SHALL show only a centered combined destination count, using density-aware screen-distance grouping. Each group SHALL have a tapered area glow at least twice the marker diameter. Zoom buttons SHALL move in quarter-level increments. Detailed outbreak silhouettes SHALL appear by zoom 12.

#### Scenario: Inspect a mixed area
- **WHEN** an area contains outbreaks in different states and Field Labs
- **THEN** its summary reports the combined destination count without descriptive labels or state dots.

#### Scenario: Zooming in from Overview
- **WHEN** the player zooms in slightly from the settled Overview camera
- **THEN** relative to the settled Overview zoom, grouping begins separating at −0.375, becomes finer at +0.125, and shows individual destinations at +0.625; grouping ends by zoom 11.375.

### Requirement: Clear individual destinations
A splitting pair SHALL have one centered badge across both halves at every zoom. Remnant cores SHALL be large enough to remain visible alongside their badge. Field Labs SHALL use enlarged artwork and circular destination markers with twice the preceding marker diameter. New labs SHALL show their circular collection boundary. The map SHALL omit Field Lab restoration/name labels; details SHALL remain available on selection.

#### Scenario: Inspect splitting and small destinations
- **WHEN** the player zooms from individual markers into detailed outbreak and lab artwork
- **THEN** splitting retains one badge, remnants remain visible, and labs have a circular marker with readable antenna/station artwork.

### Requirement: Effort-colored distant groups
Group fill and glow SHALL reflect arithmetic average remaining outbreak visits through a muted ochre/terracotta/rose effort palette, excluding labs. Lab-only groups SHALL use muted mint. Group numerals SHALL use soft cream without a dark text halo. Grouping SHALL begin 2–3 quarter-level zoom-out presses farther out than the preceding design.

#### Scenario: Mixed effort destinations
- **WHEN** light and heavy outbreaks share a group with a Field Lab
- **THEN** the group color reflects the mean remaining outbreak visits and the lab does not dilute the effort.

### Requirement: Halo and simplified body hierarchy
Every detailed outbreak state SHALL share Clearing’s broad layered stroke halo, scaled to body size, with only palette colors differing. Acute corners SHALL NOT produce stroke spikes. Simplified Heavy bodies SHALL retain the reference size; Medium SHALL be 10% smaller, and Light and Remnant SHALL be 15% smaller.

#### Scenario: Compare distant efforts
- **WHEN** individual destinations are shown as colored bodies and icons
- **THEN** Heavy/Disintegrating use full-size bodies, Medium/Cracking/Clearing/Splitting/Withering use 90%, and Light/Remnant/Cooldown/Visited use 85%.

### Requirement: Bounded artwork preparation ahead of panning
Android SHALL prepare deterministic base artwork for nearby outbreaks outside the viewport, prioritizing visible bodies and keeping generation, native sources and animation bounded. Camera movement SHALL refresh preparation targets before the gesture settles.

#### Scenario: Pan into a nearby outbreak
- **WHEN** an outbreak lies within half a viewport width or height beyond the current view
- **THEN** its base artwork is prepared in advance when capacity allows, with visible outbreaks prioritized, stable tie ordering and at most 24 prepared bodies; animation is limited to four visible bodies.

### Requirement: Forgiving remnant contact size
New remnant collection footprints SHALL use twice the previous radius, with the same geometry used for presentation and contact validation. Normal shoreline and neighbor separation SHALL remain enforced. Existing historical contact intervals SHALL remain unchanged.

#### Scenario: Ride beyond the former remnant edge
- **WHEN** a recorded route falls outside the former remnant boundary but within the enlarged footprint
- **THEN** the remnant is contactable without increasing its point reward or changing its one-touch clearing rule.
