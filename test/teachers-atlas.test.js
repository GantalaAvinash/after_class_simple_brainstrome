import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";
import { test } from "node:test";
import { mutateTeacher } from "../src/teachers.js";
import { mutateLesson } from "../src/admin.js";

test(
  "REAL ATLAS: opposite-side teacher assignment races have one winner",
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
      throw new Error("Atlas teacher test connection failed.");
    }
    const db = client.db(name),
      a = new ObjectId(),
      b = new ObjectId(),
      ids = [],
      requests = [];
    t.after(async () => {
      try {
        await db.collection("teacher").deleteMany({ _id: { $in: ids } });
        await db.collection("lesson").deleteMany({ _id: { $in: [a, b] } });
        await db
          .collection("adminAudit")
          .deleteMany({ _id: { $in: requests } });
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
      topic: "Isolated race lesson",
      location: "Hendon",
      price: 9,
      space: 5,
      image: "/images/maths.svg",
    };
    await db.collection("lesson").insertMany([
      { ...lesson, _id: a },
      { ...lesson, _id: b },
    ]);
    await db.collection("adminAudit").createIndex({ occurredAt: 1 });
    const teacher = {
      firstName: "Atlas",
      lastName: "Fixture",
      bio: "Isolated test.",
      specialism: "Testing",
    };
    const created = await mutateTeacher(
      db,
      client,
      "test-operator",
      "create",
      null,
      { requestId: requestId(), teacher, lessonIds: [String(a)] },
    );
    ids.push(created.teacher._id);
    const results = await Promise.allSettled([
      mutateTeacher(
        db,
        client,
        "test-operator",
        "update",
        String(created.teacher._id),
        {
          requestId: requestId(),
          revision: 1,
          teacher,
          lessonIds: [String(b)],
        },
      ),
      mutateLesson(db, client, "test-operator", "update", String(a), {
        requestId: requestId(),
        revision: 1,
        lesson,
        teacherIds: [],
      }),
    ]);
    assert.equal(
      results.filter((result) => result.status === "fulfilled").length,
      1,
    );
    assert.equal(
      results.find((result) => result.status === "rejected").reason.status,
      409,
    );
    const current = await db
      .collection("teacher")
      .findOne({ _id: created.teacher._id });
    assert.deepEqual(
      current.lessonIds.map(String),
      results[0].status === "fulfilled" ? [String(b)] : [],
    );
    assert.equal((await db.collection("lesson").findOne({ _id: a })).space, 5);
    assert.equal((await db.collection("lesson").findOne({ _id: b })).space, 5);
  },
);
