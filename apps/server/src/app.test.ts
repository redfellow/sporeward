import { afterEach, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import { createApp } from "./app.ts";

let app: FastifyInstance | undefined;

afterEach(async function (): Promise<void> {
	await app?.close();
});

test("health is available without an external database or network listener", async function (): Promise<void> {
	app = await createApp();
	const response = await app.inject({ method: "GET", url: "/health" });
	expect(response.statusCode).toBe(200);
	expect(response.json()).toEqual({ service: "sporeward", status: "ok", accounts: false });
});

test('network API rejects missing, invalid, and malformed credentials before routing',async()=> {
 app=await createApp({auth:{username:'tester',password:'test-only-password'}});
 for(const authorization of [undefined,'Basic invalid','Bearer test-only-password','Basic '+Buffer.from('tester:wrong').toString('base64')]) {
  const response=await app.inject({url:'/health',headers:authorization?{authorization}:{}});expect(response.statusCode).toBe(401);expect(response.headers['www-authenticate']).toContain('Basic');
 }
 expect((await app.inject({url:'/unrecognized'})).statusCode).toBe(401);
 const authorization='Basic '+Buffer.from('tester:test-only-password').toString('base64');
 expect((await app.inject({url:'/health',headers:{authorization}})).statusCode).toBe(200);
 expect((await app.inject({url:'/unrecognized',headers:{authorization}})).statusCode).toBe(404);
});
test('request budget is enforced for repeated requests',async()=> {
 app=await createApp({rateLimitMax:2});
 expect((await app.inject({url:'/health'})).statusCode).toBe(200);
 expect((await app.inject({url:'/health'})).statusCode).toBe(200);
 expect((await app.inject({url:'/health'})).statusCode).toBe(429);
});
