/** Current balancing experiment. Time values are milliseconds. */
export const BALANCE = {
	visitCooldownMs: 6 * 60 * 60 * 1000,
	minimumActivityDistanceMetres: 500,
	firstVisitPoints: 100,
	cleanupBonus: 100,
	repeatCleaningStrength: [1, 0.75, 0.6, 0.5],
	fastCleaningFraction: 0.25,
	fastCleaningDurationMs: 5 * 60 * 1000,
	slowCleaningDurationMs: 12 * 60 * 60 * 1000
} as const;

// Full event-driven outbreak rules will be extracted from the simulation here.
