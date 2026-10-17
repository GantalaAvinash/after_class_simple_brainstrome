import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { MongoClient } from "mongodb";
import { test } from "node:test";
import { mutateLesson } from "../src/admin.js";
import { createPendingOrder, orderResponse } from "../src/orders.js";
import { updateLessons } from "../src/updates.js";
import { getEnrolment } from "../src/enrolment.js";

test(
  "REAL ATLAS: duplicate admin creation, stale edits and history-preserving deletion",
  { skip: !process.env.MONGODB_TEST_URI },
  async (t) => {
    const name = process.env.MONGODB_TEST_DATABASE || "afterclass_test";
    assert.match(name, /^[A-Za-z0-9_-]+_test$/);
    assert.notEqual(name, process.env.DATABASE_NAME || "afterclass");
    const client = new MongoClient(process.env.MONGODB_TEST_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    try {
      await client.connect();
    } catch {
      await client.close();
      throw new Error("Atlas admin test connection failed.");
    }
    const db = client.db(name),
      requests = [],
      ids = [],
      orders = [];
    t.after(async () => {
      try {
        await db
          .collection("adminAudit")
          .deleteMany({ _id: { $in: requests } });
        await db.collection("lesson").deleteMany({ _id: { $in: ids } });
        await db.collection("order").deleteMany({ requestId: { $in: orders } });
      } finally {
        await client.close();
      }
    });
    const requestId = () => {
      const id = randomUUID();
      requests.push(id);
      return id;
    };
    const lesson = {
      topic: "Isolated test lesson",
      location: "Hendon",
      price: 9,
      space: 5,
      image: "/images/maths.svg",
    };
    const body = { requestId: requestId(), lesson, teacherIds: [] };
    const action = (type, id, payload) =>
      mutateLesson(db, client, "test-operator", type, id, payload);
    // Create collections outside the competing transactions, isolating the race
    // under test from MongoDB's first-collection creation lock.
    await db.collection("adminAudit").createIndex({ occurredAt: 1 });
    await db.collection("lesson").createIndex({ topic: 1 });
    const [first, replay] = await Promise.all([
      action("create", null, body),
      action("create", null, body),
    ]);
    ids.push(first.lesson._id);
    assert.ok(first.lesson._id.equals(replay.lesson._id));
    const id = first.lesson._id.toHexString();
    const orderRequest = randomUUID();
    orders.push(orderRequest);
    const { order } = await createPendingOrder(db, {
      requestId: orderRequest,
      name: "Ava",
      phone: "007123",
      items: [{ lessonId: id, quantity: 2 }],
    });
    const confirm = JSON.parse(
      JSON.stringify({
        orderId: order._id,
        updates: orderResponse(order).updates,
      }),
    );
    await updateLessons(db, client, confirm);
    await assert.rejects(
      action("update", id, { ...body, requestId: requestId(), revision: 1 }),
      (error) => error.status === 409,
    );
    await action("delete", id, { requestId: requestId(), revision: 2 });
    assert.equal((await getEnrolment(db, id)).enrolment, 2);
    await updateLessons(db, client, confirm);
    assert.equal(
      (await db.collection("lesson").findOne({ _id: first.lesson._id })).space,
      3,
    );
    await action("restore", id, { requestId: requestId(), revision: 3 });
    assert.equal(
      (await db.collection("lesson").findOne({ _id: first.lesson._id }))
        .deleted,
      false,
    );
  },
);
