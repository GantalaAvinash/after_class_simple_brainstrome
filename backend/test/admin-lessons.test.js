import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { mutateLesson, adminOverview, listAdminLessons } from "../src/admin.js";
import { fixtures } from "../support/fixtures.js";
import { testDatabase } from "../support/test-database.js";
import { findLessons } from "../src/catalogue.js";
import { createPendingOrder, orderResponse } from "../src/orders.js";
import { updateLessons } from "../src/updates.js";
import { getEnrolment } from "../src/enrolment.js";

const a = "100000000000000000000001",
  b = "100000000000000000000002";
const teacherId = "200000000000000000000001";
const lesson = {
  topic: "Creative Robotics",
  location: "Hendon",
  price: 25.5,
  space: 8,
  image: "/images/robotics.svg",
};
const input = (extra = {}) => ({
  requestId: randomUUID(),
  lesson,
  teacherIds: [teacherId],
  ...extra,
});
const run = (data, action, id, body) =>
  mutateLesson(data.db, data.client, "operator", action, id, body);
async function pending(data) {
  const { order } = await createPendingOrder(data.db, {
    requestId: randomUUID(),
    name: "Ava",
    phone: "007123",
    items: [
      { lessonId: a, quantity: 1 },
      { lessonId: b, quantity: 1 },
    ],
  });
  return JSON.parse(
    JSON.stringify({
      orderId: order._id,
      updates: orderResponse(order).updates,
    }),
  );
}

test("admin create/update/delete/restore is audited, replayable and teacher associations stay consistent", async () => {
  const data = testDatabase(await fixtures());
  const body = input();
  const first = await run(data, "create", null, body);
  const id = first.lesson._id.toHexString();
  assert.equal((await findLessons(data.db)).length, 13);
  assert.equal(data.state.teacher[0].lessonIds.at(-1).toHexString(), id);
  assert.equal(
    (await run(data, "create", null, body)).lesson._id.toHexString(),
    id,
  );
  assert.equal(data.state.adminAudit.length, 1);
  await assert.rejects(
    run(data, "create", null, { ...body, lesson: { ...lesson, price: 30 } }),
    (error) => error.status === 409,
  );
  const edited = await run(
    data,
    "update",
    id,
    input({ revision: 1, lesson: { ...lesson, price: 30 }, teacherIds: [] }),
  );
  assert.equal(edited.lesson.price, 30);
  assert.ok(
    !data.state.teacher[0].lessonIds.some(
      (value) => value.toHexString() === id,
    ),
  );
  const deleted = await run(data, "delete", id, {
    requestId: randomUUID(),
    revision: 2,
  });
  assert.equal(deleted.lesson.deleted, true);
  assert.equal((await findLessons(data.db)).length, 12);
  assert.equal((await listAdminLessons(data.db)).length, 13);
  await run(data, "restore", id, { requestId: randomUUID(), revision: 3 });
  assert.equal((await findLessons(data.db)).length, 13);
  assert.equal(data.state.adminAudit.length, 4);
});

test("stale edits after checkout are rejected instead of restoring sold spaces", async () => {
  const data = testDatabase(await fixtures());
  const request = await pending(data);
  await updateLessons(data.db, data.client, request);
  await assert.rejects(
    run(data, "update", a, input({ revision: 0 })),
    (error) => error.status === 409,
  );
  assert.equal(data.state.lesson[0].space, 4);
  assert.equal(data.state.adminAudit?.length || 0, 0);
});

test("deletion during a multi-lesson checkout rolls everything back and leaves history available", async () => {
  const data = testDatabase(await fixtures());
  const request = await pending(data);
  await run(data, "delete", b, { requestId: randomUUID(), revision: 0 });
  await assert.rejects(
    updateLessons(data.db, data.client, request),
    (error) => error.status === 409,
  );
  assert.equal(data.state.lesson[0].space, 5);
  assert.equal(data.state.order[0].status, "pending");
  await assert.rejects(
    createPendingOrder(data.db, {
      requestId: randomUUID(),
      name: "Ava",
      phone: "007123",
      items: [{ lessonId: b, quantity: 1 }],
    }),
    (error) => error.status === 404,
  );
  await run(data, "restore", b, { requestId: randomUUID(), revision: 1 });
  await updateLessons(data.db, data.client, request);
  await run(data, "delete", b, { requestId: randomUUID(), revision: 3 });
  assert.equal((await getEnrolment(data.db, b)).enrolment, 1);
  const overview = await adminOverview(data.db);
  assert.equal(overview.stats.confirmedOrders, 1);
  assert.equal(overview.stats.purchasedPlaces, 2);
  assert.ok(!JSON.stringify(overview).includes("007123"));
});

test("teacher failures, invalid images/fields and transaction failure cannot leave a partial edit", async () => {
  const data = testDatabase(await fixtures());
  await assert.rejects(
    run(
      data,
      "create",
      null,
      input({ teacherIds: ["ffffffffffffffffffffffff"] }),
    ),
    (error) => error.status === 404,
  );
  for (const changes of [
    { space: -1 },
    { price: 1.111 },
    { image: "/images/missing.svg" },
    { topic: "" },
    { deleted: true },
  ]) {
    await assert.rejects(
      run(data, "create", null, input({ lesson: { ...lesson, ...changes } })),
      (error) => error.status === 400,
    );
  }
  data.controls.failOnUpdate = 2;
  await assert.rejects(
    run(data, "update", a, input({ revision: 0, teacherIds: [] })),
    /Simulated/,
  );
  assert.equal(data.state.lesson[0].topic, "Maths Explorers");
  assert.equal(data.state.adminAudit.length, 0);
});

test("price changes between pending order and confirmation require a fresh checkout", async () => {
  const data = testDatabase(await fixtures());
  const request = await pending(data);
  await updateLessons(data.db, data.client, {
    updates: [{ lessonId: a, changes: { price: 30 } }],
  });
  await assert.rejects(
    updateLessons(data.db, data.client, request),
    (error) => error.status === 409,
  );
  assert.equal(data.state.lesson[0].space, 5);
});
