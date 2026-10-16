import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { test } from 'node:test';
import { createPendingOrder, orderResponse } from '../src/orders.js';
import { updateLessons } from '../src/updates.js';
import { testDatabase } from '../support/test-database.js';

const a = new ObjectId('100000000000000000000001');
const b = new ObjectId('100000000000000000000002');
const setup = (space = 5) => testDatabase({ lesson: [{ _id: a, topic: 'Maths', price: 9, space }, { _id: b, topic: 'Art', price: 20, space }] });
const body = (ids = [a, b], quantity = 2) => ({ requestId: randomUUID(), name: 'Ava', phone: '007123456', items: ids.map((id) => ({ lessonId: id.toHexString(), quantity })) });
async function pending(db, payload) {
  const { order } = await createPendingOrder(db, payload);
  return JSON.parse(JSON.stringify({ orderId: order._id, updates: orderResponse(order).updates }));
}

test('multi-lesson checkout confirms once and repeat PUT/POST does not deduct twice', async () => {
  const { db, client, state } = setup();
  const payload = body();
  const request = await pending(db, payload);
  assert.equal((await updateLessons(db, client, request)).status, 'confirmed');
  await updateLessons(db, client, request);
  assert.equal((await createPendingOrder(db, payload)).order.status, 'confirmed');
  assert.deepEqual(state.lesson.map((lesson) => lesson.space), [3, 3]);
  assert.equal(state.order.length, 1);
});

test('a conflict on the second lesson rolls back the first lesson', async () => {
  const { db, client, state } = setup();
  const request = await pending(db, body());
  state.lesson[1].space = 1;
  await assert.rejects(updateLessons(db, client, request), (error) => error.status === 409);
  assert.deepEqual(state.lesson.map((lesson) => lesson.space), [5, 1]);
  assert.equal(state.order[0].status, 'pending');
});

test('a database failure after one stock write leaves all stock and the order unchanged', async () => {
  const { db, client, state, controls } = setup();
  const request = await pending(db, body());
  controls.failOnUpdate = 2;
  await assert.rejects(updateLessons(db, client, request), /Simulated write failure/);
  assert.deepEqual(state.lesson.map((lesson) => lesson.space), [5, 5]);
  assert.equal(state.order[0].status, 'pending');
});

test('two orders competing for the last space have one confirmed winner', async () => {
  const { db, client, state } = setup(1);
  const first = await pending(db, body([a], 1));
  const second = await pending(db, body([a], 1));
  const results = await Promise.allSettled([updateLessons(db, client, first), updateLessons(db, client, second)]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(state.lesson[0].space, 0);
  assert.equal(state.order.filter((order) => order.status === 'confirmed').length, 1);
});

test('incomplete or forged checkout changes are rejected without writing stock', async () => {
  const { db, client, state } = setup();
  const request = await pending(db, body());
  await assert.rejects(updateLessons(db, client, { ...request, updates: request.updates.slice(1) }), (error) => error.status === 400);
  request.updates[0].changes = { space: 0, price: 1 };
  await assert.rejects(updateLessons(db, client, request), (error) => error.status === 400);
  assert.deepEqual(state.lesson.map((lesson) => lesson.space), [5, 5]);
});
