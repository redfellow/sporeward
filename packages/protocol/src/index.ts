export interface HealthResponse {
	readonly service: "sporeward";
	readonly status: "ok";
}

// Add runtime validation when activity and outbreak API contracts are defined.
export * from './activities';

export * from "./world";
