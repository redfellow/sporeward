# Outing Feedback Specification

## Purpose

Explain confirmed activity results and conditional rewards without duplicating visit-scoring, Field Lab, Resistance or map-visual requirements.

## ADDED Requirements

### Requirement: Separate confirmed points from conditional cleanup bonuses
Activity feedback SHALL distinguish points already confirmed from a possible cleanup bonus that remains conditional. A pending bonus SHALL NOT be presented as earned or included in confirmed totals before authoritative award.

#### Scenario: Finish with a cleanup bonus pending
- **WHEN** an outing has confirmed visit points and an unresolved possible cleanup bonus
- **THEN** its feedback shows the confirmed points separately from the conditional bonus and does not add the pending amount to the confirmed total.

### Requirement: Explain and update the outing result
An outing recap SHALL show its confirmed points and relevant outbreak or Field Lab results. When a later authoritative award changes that outing's confirmed result, the recap SHALL reflect the updated result while retaining the distinction between earned and still-conditional rewards.

#### Scenario: A delayed bonus is confirmed
- **WHEN** a previously pending cleanup bonus is awarded after the outing ends
- **THEN** the original outing recap reflects the confirmed award and no longer presents that award as pending.
