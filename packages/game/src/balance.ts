/** Current balancing experiment. Time values are milliseconds. */
export const BALANCE = {
	visitCooldownMs: 6 * 60 * 60 * 1000,
	minimumActivityDistanceMetres: 500,
	firstVisitPoints: 100,
	cleanupBonus: 100,
 minimumVisitPoints: 5,
 pointRecoveryDelayMs: 72 * 60 * 60 * 1000,
 pointRecoveryDurationMs: 14 * 24 * 60 * 60 * 1000,
 cleanupProtectionMs: 10 * 60 * 1000,
 splitStabilizationMs: 30 * 60 * 1000,
 initialCells: 5,
 maximumCells: 10,
 growthDurationMs: 4 * 24 * 60 * 60 * 1000,
 disintegrationDurationMs: 24 * 60 * 60 * 1000,
 fullVisitExtensionMs: 2 * 60 * 60 * 1000,
 maximumExtensionMs: 24 * 60 * 60 * 1000,
 remnantLifetimeMs: 72 * 60 * 60 * 1000,
 splitProbability: 0.2,
 splitEffortReduction: 0.1,
	repeatCleaningStrength: [1, 0.75, 0.6, 0.5],
	fastCleaningFraction: 0.25,
	fastCleaningDurationMs: 5 * 60 * 1000,
	slowCleaningDurationMs: 12 * 60 * 60 * 1000
} as const;


/** Provisional geographic-world tuning, separate from per-outbreak scoring. */
export const SPATIAL_BALANCE={
 replacementInitialDelayMs:60*60*1000,
 replacementIntervalMs:30*60*1000,
 remnantRadiusCells:8
} as const;
export type SpatialBalance={[K in keyof typeof SPATIAL_BALANCE]:number};
