import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { test } from 'node:test';
import { createPendingOrder } from '../src/orders.js';
import { testDatabase } from '../support/test-database.js';

const lessonId = new ObjectId('100000000000000000000001');
const setup = () => testDatabase({ lesson: [{ _id: lessonId, topic: 'Maths', price: 9, space: 5 }] });
const payload = () => ({ requestId: randomUUID(), name: 'Ava', phone: '007123456', items: [{ lessonId: lessonId.toHexString(), quantity: 2 }] });

test('POST saves a pending order with quantities and absolute targets without reducing stock', async () => {
  const { db, state } = setup();
  const { order, created } = await createPendingOrder(db, payload());
  assert.equal(created, true);
  assert.equal(order.status, 'pending');
  assert.equal(order.items[0].spaceAfter, 3);
  assert.equal(order.phone, '007123456');
  assert.equal(state.lesson[0].space, 5);
});

test('repeated and simultaneous POST attempts create only one order', async () => {
  const { db, state } = setup();
  const body = payload();
  const results = await Promise.all([createPendingOrder(db, body), createPendingOrder(db, body)]);
  assert.equal(state.order.length, 1);
  assert.ok(results[0].order._id.equals(results[1].order._id));
  await assert.rejects(createPendingOrder(db, { ...body, name: 'Theo' }), (error) => error.status === 409);
});

test('unavailable and missing lessons do not create pending orders', async () => {
  const { db, state } = setup();
  const body = payload();
  body.items[0].quantity = 6;
  await assert.rejects(createPendingOrder(db, body), (error) => error.status === 409);
  body.items[0] = { lessonId: new ObjectId().toHexString(), quantity: 1 };
  await assert.rejects(createPendingOrder(db, body), (error) => error.status === 404);
  assert.equal(state.order.length, 0);
});
