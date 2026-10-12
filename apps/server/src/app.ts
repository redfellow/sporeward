import Fastify, { type FastifyInstance } from "fastify";
import type { HealthResponse } from "@sporeward/protocol";

export function createApp(): FastifyInstance {
	const app = Fastify();
	app.get("/health", async function (): Promise<HealthResponse> {
		return { service: "sporeward", status: "ok" };
	});
	return app;
}
