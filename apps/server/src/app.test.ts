import { afterEach, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import { createApp } from "./app.ts";

let app: FastifyInstance | undefined;

afterEach(async function (): Promise<void> {
	await app?.close();
});

test("health is available without an external database or network listener", async function (): Promise<void> {
	app = createApp();
	const response = await app.inject({ method: "GET", url: "/health" });
	expect(response.statusCode).toBe(200);
	expect(response.json()).toEqual({ service: "sporeward", status: "ok" });
});
