import assert from "node:assert/strict";
import { test } from "node:test";
import { createApp } from "../src/app.js";
import { readConfig } from "../src/config.js";

async function serve(t, db, logger = () => {}) {
  const app = createApp({
    db,
    allowedOrigins: ["http://localhost:8080"],
    logger,
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  t.after(
    () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  );
  return `http://127.0.0.1:${server.address().port}`;
}

test("configuration rejects missing credentials without echoing a URI", () => {
  assert.throws(() => readConfig({}), /Set a valid MONGODB_URI/);
  assert.throws(
    () => readConfig({ MONGODB_URI: "secret-value" }),
    (error) => !error.message.includes("secret-value"),
  );
});

test("configuration rejects invalid ports and CORS paths", () => {
  const env = { MONGODB_URI: "mongodb+srv://example.invalid", PORT: "0" };
  assert.throws(() => readConfig(env), /PORT/);
  assert.throws(
    () =>
      readConfig({
        ...env,
        PORT: "3000",
        FRONTEND_ORIGINS: "https://example.com/repo",
      }),
    /without paths/,
  );
});

test("GET lessons returns database records and logs the HTTP result", async (t) => {
  const records = [
    { _id: "100000000000000000000001", topic: "Maths", space: 5 },
  ];
  const logs = [];
  const db = {
    collection: (name) => {
      assert.equal(name, "lesson");
      return { find: () => ({ toArray: async () => records }) };
    },
  };
  const url = await serve(t, db, (line) => logs.push(JSON.parse(line)));
  const response = await fetch(`${url}/lessons`, {
    headers: { Origin: "http://localhost:8080" },
  });
  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get("access-control-allow-origin"),
    "http://localhost:8080",
  );
  assert.equal(response.headers.get("x-powered-by"), null);
  assert.deepEqual(await response.json(), records);
  assert.equal(logs[0].method, "GET");
  assert.equal(logs[0].url, "/lessons");
  assert.equal(logs[0].status, 200);
  assert.ok(Number.isFinite(logs[0].durationMs));
});

test("disallowed browser origins cannot access the API", async (t) => {
  const url = await serve(t, {});
  const response = await fetch(`${url}/lessons`, {
    headers: { Origin: "https://other.example" },
  });
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});

test("CORS preflight allows JSON POST and PUT", async (t) => {
  const url = await serve(t, {});
  const response = await fetch(`${url}/lessons`, {
    method: "OPTIONS",
    headers: { Origin: "http://localhost:8080" },
  });
  assert.equal(response.status, 204);
  assert.match(response.headers.get("access-control-allow-methods"), /PUT/);
  assert.equal(
    response.headers.get("access-control-allow-headers"),
    "Content-Type, Authorization",
  );
});

test("health reports a database outage as 503 without leaking details", async (t) => {
  const url = await serve(t, {
    command: async () => {
      throw new Error("private database detail");
    },
  });
  const response = await fetch(`${url}/health`);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: "The database is temporarily unavailable.",
  });
});

test("unknown routes and malformed JSON have explicit responses", async (t) => {
  const url = await serve(t, {});
  assert.equal((await fetch(`${url}/missing`)).status, 404);
  const response = await fetch(`${url}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{invalid",
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "The request body must be valid JSON.",
  });
});

test("GET lessons failure is a generic 500, not a secret-bearing database error", async (t) => {
  const url = await serve(t, {
    collection: () => {
      throw new Error("private database detail");
    },
  });
  const response = await fetch(`${url}/lessons`);
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    error: "The request could not be completed.",
  });
});
