import assert from "node:assert/strict";
import { test } from "node:test";
import {
  lessonHash,
  lessonRoute,
  createLessonLoader,
} from "../lesson-route.mjs";
import { changeCart, availableSpace } from "../state.mjs";
const a = "100000000000000000000001",
  b = "100000000000000000000002";
test("shareable lesson links validate IDs and ignore normal catalogue anchors", () => {
  assert.deepEqual(lessonRoute(lessonHash(a)), { view: "detail", id: a });
  assert.deepEqual(lessonRoute("#catalogue"), { view: "catalogue", id: null });
  for (const hash of [
    "#/lessons/bad",
    "#/lessons/../orders",
    "#/lessons/" + a + "/extra",
  ])
    assert.deepEqual(lessonRoute(hash), { view: "detail", id: null });
  assert.throws(() => lessonHash("bad"));
});
test("rapid detail navigation cannot replace a new page with a stale response", async () => {
  const resolve = {};
  const loader = createLessonLoader(
    (path) =>
      new Promise((done) => {
        resolve[path] = done;
      }),
  );
  const first = loader.load(a),
    second = loader.load(b);
  resolve["/lessons/" + b]({ lesson: { _id: b }, teachers: [] });
  assert.equal((await second).lesson._id, b);
  resolve["/lessons/" + a]({ lesson: { _id: a }, teachers: [] });
  assert.equal(await first, null);
});
test("detail loading validates responses and detail additions use the existing quantity guard", async () => {
  await assert.rejects(
    createLessonLoader(async () => ({})).load(a),
    /could not be verified/,
  );
  const lessons = { [a]: { _id: a, space: 1 } };
  let cart = changeCart(lessons, {}, a, 1);
  assert.equal(availableSpace(lessons[a], cart), 0);
  assert.equal(changeCart(lessons, cart, a, 1), cart);
  cart = changeCart(lessons, cart, a, -1);
  assert.deepEqual(cart, {});
});
