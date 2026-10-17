import assert from "node:assert/strict";
import { test } from "node:test";
import {
  emptyTeacher,
  teacherErrors,
  teacherMutationAttempt,
  restoreAdminAttempt,
  submitAdminAttempt,
  emptyLesson,
  lessonErrors,
  mutationAttempt,
} from "../admin-state.mjs";
const id = "200000000000000000000001",
  lessonId = "100000000000000000000001";
test("teacher editor validates names, keeps assignments and retries with the same revision", async () => {
  const draft = {
    ...emptyTeacher(),
    firstName: " Niamh ",
    lastName: "O'Connor",
    lessonIds: [lessonId],
  };
  assert.deepEqual(teacherErrors(draft), {});
  for (const value of [
    { firstName: "" },
    { lastName: "Name2" },
    { lessonIds: [lessonId, lessonId] },
    { bio: "a".repeat(2001) },
  ])
    assert.ok(Object.keys(teacherErrors({ ...draft, ...value })).length);
  const attempt = teacherMutationAttempt(
    "update",
    { _id: id, revision: 3 },
    draft,
  );
  assert.equal(attempt.body.teacher.firstName, "Niamh");
  assert.deepEqual(
    restoreAdminAttempt({ getItem: () => JSON.stringify(attempt) }),
    attempt,
  );
  assert.equal(
    (
      await submitAdminAttempt(
        {
          request: async () => ({
            teacher: { _id: id, revision: 4, deleted: false },
          }),
        },
        attempt,
      )
    ).teacher.revision,
    4,
  );
  await assert.rejects(
    submitAdminAttempt(
      {
        request: async () => ({
          lesson: { _id: id, revision: 4, deleted: false },
        }),
      },
      attempt,
    ),
    /could not be verified/,
  );
});
test("lesson descriptions, duration and outcomes are validated and retained in management requests", () => {
  const draft = {
    ...emptyLesson(),
    topic: "Club",
    location: "Hendon",
    price: 19,
    description: "An example programme.",
    ageGroup: "Ages 8–12",
    durationMinutes: "75",
    outcomesText: "First outcome\n\n Second outcome",
  };
  assert.deepEqual(lessonErrors(draft), {});
  const body = mutationAttempt("create", null, draft).body;
  assert.equal(body.lesson.durationMinutes, 75);
  assert.deepEqual(body.lesson.learningOutcomes, [
    "First outcome",
    "Second outcome",
  ]);
  for (const value of [
    { durationMinutes: 1.5 },
    { durationMinutes: 481 },
    { description: "a".repeat(2001) },
    { outcomesText: Array(9).fill("outcome").join("\n") },
  ])
    assert.ok(Object.keys(lessonErrors({ ...draft, ...value })).length);
});
