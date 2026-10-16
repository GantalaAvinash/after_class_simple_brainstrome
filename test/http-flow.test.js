import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { createApp } from "../src/app.js";
import { fixtures } from "../support/fixtures.js";
import { testDatabase } from "../support/test-database.js";

const a = "100000000000000000000001",
  b = "100000000000000000000002";
async function setup(t) {
  const data = testDatabase(await fixtures());
  const server = createApp({
    ...data,
    allowedOrigins: [],
    logger: () => {},
  }).listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = "http://127.0.0.1:" + server.address().port;
  const request = async (path, method = "GET", body) => {
    const response = await fetch(base + path, {
      method,
      ...(body === undefined
        ? {}
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
    });
    return { status: response.status, data: await response.json() };
  };
  return { ...data, request, base };
}
const payload = (
  items = [
    { lessonId: a, quantity: 2 },
    { lessonId: b, quantity: 1 },
  ],
) => ({ requestId: randomUUID(), name: "Ava", phone: "007123456", items });

test("HTTP workflow covers catalogue, teachers, search, POST, PUT, replay and enrolment", async (t) => {
  const { request, base } = await setup(t);
  const all = await request("/lessons");
  assert.equal(all.data.length, 12);
  for (const lesson of all.data)
    assert.equal((await fetch(base + lesson.image)).status, 200);
  const teachers = await request("/teachers");
  assert.equal(teachers.data.length, 4);
  assert.equal(
    (await request("/lessons?teacherId=200000000000000000000001")).data.length,
    3,
  );
  assert.equal((await request("/lessons?q=HENDON")).data.length, 3);
  assert.ok(
    (await request("/lessons?q=9")).data.some((lesson) => lesson._id === a),
  );
  const body = payload();
  const pending = await request("/orders", "POST", body);
  assert.equal(pending.status, 201);
  assert.equal((await request("/enrolment/" + a)).data.enrolment, 0);
  const update = {
    orderId: pending.data.orderId,
    updates: pending.data.updates,
  };
  const result = await request("/lessons", "PUT", update);
  assert.equal(result.data.status, "confirmed");
  assert.equal((await request("/lessons", "PUT", update)).status, 200);
  assert.equal(
    (await request("/orders", "POST", body)).data.status,
    "confirmed",
  );
  assert.equal((await request("/enrolment/" + a)).data.enrolment, 2);
  assert.equal((await request("/enrolment/" + b)).data.enrolment, 1);
  const general = await request("/lessons", "PUT", {
    updates: [{ lessonId: a, changes: { price: 100, space: 12 } }],
  });
  assert.equal(general.status, 401);
  assert.equal((await request("/enrolment/" + a)).data.enrolment, 2);
});

test("HTTP invalid input and oversized payloads return explicit safe errors", async (t) => {
  const { request } = await setup(t);
  for (const path of [
    "/lessons?teacherId=bad",
    "/lessons?q=a&q=b",
    "/enrolment/bad",
  ])
    assert.equal((await request(path)).status, 400);
  assert.equal(
    (await request("/enrolment/ffffffffffffffffffffffff")).status,
    404,
  );
  assert.equal(
    (await request("/orders", "POST", { ...payload(), name: "Ava Smith" }))
      .status,
    400,
  );
  assert.equal(
    (
      await request("/lessons", "PUT", {
        updates: [{ lessonId: a, changes: { $inc: { space: 1 } } }],
      })
    ).status,
    401,
  );
  assert.equal(
    (await request("/orders", "POST", { text: "x".repeat(21000) })).status,
    413,
  );
  assert.equal((await request("/images/missing.svg")).status, 404);
});

test("HTTP checkout conflict rolls back all places and preserves a pending order", async (t) => {
  const { request, state } = await setup(t);
  const pending = await request("/orders", "POST", payload());
  state.lesson.find((lesson) => lesson._id.toHexString() === b).space = 0;
  const response = await request("/lessons", "PUT", {
    orderId: pending.data.orderId,
    updates: pending.data.updates,
  });
  assert.equal(response.status, 409);
  assert.equal(
    state.lesson.find((lesson) => lesson._id.toHexString() === a).space,
    5,
  );
  assert.equal(state.order[0].status, "pending");
});
