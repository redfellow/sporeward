# Spec Delta

## Purpose

Let players learn Sporeward's map language and native outing loop inside the Android app, including without connectivity.

## ADDED Requirements

### Requirement: Offline map entry and safe return
The native app SHALL offer a field guide directly from the map. The guide SHALL work without signing in or fetching remote content, and its close control and Android back SHALL return to the map without pausing, finishing or replacing an active recording.

#### Scenario: Read the guide during an outing
- **WHEN** a player opens and closes the guide while recording offline
- **THEN** the guide remains readable and the same recording continues unchanged

### Requirement: Brief introduction before detailed specimens
The guide SHALL lead with a concise explanation of recording a walk, run or ride, touching outbreaks, cleaning, and reviewing rewards. Detailed visual explanations SHALL remain separately accessible without requiring a long introductory read.

#### Scenario: Learn the basic loop
- **WHEN** a first-time tester opens the guide
- **THEN** the first screen explains the basic outing loop and provides access to outbreak and Field Lab/Resistance explanations

### Requirement: Approved visual specimens
The guide SHALL illustrate effort, disintegration, remnants, withering, clearing, cooldown and current-outing contact using the accepted Ember & violet silhouettes, membranes and centered badges. It SHALL explain that a contact check does not guarantee points. Optional specimen animation SHALL stop in the background and honor system reduced motion.

#### Scenario: Compare cooldown and contact
- **WHEN** a player compares the cooldown and visited specimens
- **THEN** the visited example adds its green contact treatment while explaining that the underlying lifecycle and eligibility still apply

#### Scenario: Inspect a future split state
- **WHEN** cracks or splitting examples are shown
- **THEN** the guide identifies them as visual previews rather than claiming strategic splitting is active in the ordinary test world

### Requirement: Explain shared labs and personal resistance honestly
The guide SHALL show the accepted available and collected Field Lab installation and blue-violet Resistance field. It SHALL explain personal collection, reduced local visit points after repeated cleaning, passive recovery, and immediate resistance reduction from labs without promising a full reset, inventory item, fixed reward or reduced cleaning effect.

#### Scenario: Understand an available lab
- **WHEN** a player reads the Field Lab explanation
- **THEN** the guide explains that each player can collect independently and that the confirmed result appears in their outing recap

### Requirement: Distinguish provisional and confirmed rewards
The guide SHALL distinguish during-outing estimates, server-confirmed visit points, and conditional cleanup bonuses without claiming that the contact check guarantees an award.

#### Scenario: Understand the points display
- **WHEN** a player reads the rewards overview
- **THEN** they can distinguish an estimate before upload, confirmed points, and possible cleanup points that may be awarded later
