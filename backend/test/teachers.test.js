import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { mutateTeacher } from "../src/teachers.js";
import { mutateLesson, listAdminLessons } from "../src/admin.js";
import {
  findLessonDetail,
  findLessons,
  listPublicTeachers,
} from "../src/catalogue.js";
import { testDatabase } from "../support/test-database.js";
import { fixtures } from "../support/fixtures.js";
import { backfillSeedDetails } from "../src/seed-details.js";
import { readFile } from "node:fs/promises";
import { normaliseUpdates } from "../src/validation.js";

const a = "100000000000000000000001",
  b = "100000000000000000000002";
const teacher = {
  firstName: "Niamh",
  lastName: "O'Connor",
  specialism: "Creative learning",
  bio: "A fictitious teacher who encourages practical exploration.",
};
const body = (extra = {}) => ({
  requestId: randomUUID(),
  teacher,
  lessonIds: [a],
  ...extra,
});
const run = (data, action, id, input) =>
  mutateTeacher(data.db, data.client, "operator", action, id, input);

test("teachers can be created, edited, assigned, deleted and restored without changing stock", async () => {
  const data = testDatabase(await fixtures());
  const input = body();
  const created = await run(data, "create", null, input);
  const id = created.teacher._id.toHexString();
  assert.equal((await listPublicTeachers(data.db)).length, 5);
  assert.equal((await findLessonDetail(data.db, a)).teachers.length, 2);
  assert.equal(
    (await run(data, "create", null, input)).teacher._id.toHexString(),
    id,
  );
  const updated = await run(
    data,
    "update",
    id,
    body({ revision: 1, lessonIds: [b] }),
  );
  assert.equal(updated.teacher.lessonIds[0].toHexString(), b);
  assert.ok(
    !(await findLessonDetail(data.db, a)).teachers.some(
      (t) => t._id.toHexString() === id,
    ),
  );
  assert.equal(
    (await findLessons(data.db, { teacherId: id }))[0]._id.toHexString(),
    b,
  );
  await run(data, "delete", id, { requestId: randomUUID(), revision: 2 });
  assert.equal((await listPublicTeachers(data.db)).length, 4);
  assert.ok(
    !(await findLessonDetail(data.db, b)).teachers.some(
      (t) => t._id.toHexString() === id,
    ),
  );
  await assert.rejects(
    findLessons(data.db, { teacherId: id }),
    (e) => e.status === 404,
  );
  await run(data, "restore", id, { requestId: randomUUID(), revision: 3 });
  assert.ok(
    (await findLessonDetail(data.db, b)).teachers.some(
      (t) => t._id.toHexString() === id,
    ),
  );
  assert.ok(data.state.lesson.every((l) => l.space === 5));
  assert.equal(data.state.adminAudit.length, 4);
});

test("assignment edits from the lesson side invalidate a stale teacher editor and vice versa", async () => {
  const data = testDatabase(await fixtures());
  const { teacher: created } = await run(data, "create", null, body());
  const id = created._id.toHexString();
  const lesson = (await listAdminLessons(data.db)).find(
    (l) => l._id.toHexString() === a,
  );
  const { _id, revision, teacherIds, ...changes } = lesson;
  const editable = Object.fromEntries(
    ["topic", "location", "price", "space", "image"].map((key) => [
      key,
      changes[key],
    ]),
  );
  await mutateLesson(data.db, data.client, "operator", "update", a, {
    requestId: randomUUID(),
    revision,
    lesson: editable,
    teacherIds: teacherIds
      .filter((value) => value.toHexString() !== id)
      .map(String),
  });
  await assert.rejects(
    run(data, "update", id, body({ revision: 1, lessonIds: [b] })),
    (e) => e.status === 409,
  );
  const stale = (await listAdminLessons(data.db)).find(
    (l) => l._id.toHexString() === b,
  );
  await run(data, "update", id, body({ revision: 2, lessonIds: [b] }));
  await assert.rejects(
    mutateLesson(data.db, data.client, "operator", "update", b, {
      requestId: randomUUID(),
      revision: stale.revision,
      lesson: editable,
      teacherIds: [],
    }),
    (e) => e.status === 409,
  );
});

test("teacher mutation failures roll back associations and invalid fields or request re-use are rejected", async () => {
  const data = testDatabase(await fixtures());
  for (const extra of [
    { teacher: { ...teacher, firstName: "" } },
    { teacher: { ...teacher, password: "no" } },
    { lessonIds: ["bad"] },
    { lessonIds: [a, a] },
  ])
    await assert.rejects(
      run(data, "create", null, body(extra)),
      (e) => e.status === 400,
    );
  await assert.rejects(
    run(
      data,
      "create",
      null,
      body({ lessonIds: ["ffffffffffffffffffffffff"] }),
    ),
    (e) => e.status === 404,
  );
  const input = body();
  await run(data, "create", null, input);
  await assert.rejects(
    run(data, "create", null, { ...input, lessonIds: [b] }),
    (e) => e.status === 409,
  );
  const before = data.state.teacher.length;
  data.controls.failOnUpdate = data.controls.updates + 2;
  await assert.rejects(
    run(data, "create", null, body({ lessonIds: [a, b] })),
    /Simulated/,
  );
  assert.equal(data.state.teacher.length, before);
  assert.equal(data.state.adminAudit.length, 1);
});

test("detail responses contain authored content and active teachers; missing/deleted lessons fail safely", async () => {
  const data = testDatabase(await fixtures());
  const detail = await findLessonDetail(data.db, a);
  assert.ok(detail.lesson.description.length > 30);
  assert.ok(detail.lesson.learningOutcomes.length >= 2);
  assert.ok(Number.isInteger(detail.lesson.durationMinutes));
  assert.ok(detail.teachers[0].firstName);
  await assert.rejects(
    findLessonDetail(data.db, "bad"),
    (e) => e.status === 400,
  );
  await assert.rejects(
    findLessonDetail(data.db, "ffffffffffffffffffffffff"),
    (e) => e.status === 404,
  );
  data.state.lesson[0].deleted = true;
  await assert.rejects(findLessonDetail(data.db, a), (e) => e.status === 404);
});

test("detail editing rejects invalid types and backfill never resets authored content, stock or assignments", async () => {
  for (const changes of [
    { description: 5 },
    { ageGroup: "x".repeat(61) },
    { durationMinutes: 0 },
    { durationMinutes: 1.5 },
    { learningOutcomes: [""] },
    { learningOutcomes: Array(9).fill("Example") },
    { learningOutcomes: { $set: "no" } },
  ])
    assert.throws(() =>
      normaliseUpdates({ updates: [{ lessonId: a, changes }] }),
    );
  const data = testDatabase(await fixtures());
  data.state.lesson[0].space = 2;
  data.state.lesson[0].description = "Student-authored description.";
  delete data.state.lesson[0].ageGroup;
  delete data.state.teacher[0].bio;
  const seed = JSON.parse(
    await readFile(new URL("../data/seed.json", import.meta.url), "utf8"),
  );
  assert.equal(await backfillSeedDetails(data.db, data.client, seed), 2);
  assert.equal(await backfillSeedDetails(data.db, data.client, seed), 0);
  assert.equal(data.state.lesson[0].space, 2);
  assert.equal(
    data.state.lesson[0].description,
    "Student-authored description.",
  );
  assert.equal(data.state.teacher[0].lessonIds.length, 3);
});
