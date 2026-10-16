import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { normaliseOrder, normaliseUpdates, recordId } from '../src/validation.js';

const id = '100000000000000000000001';
const order = () => ({ requestId: randomUUID(), name: ' Ava ', phone: '007123456789', items: [{ lessonId: id, quantity: 2 }] });
const invalid = (fn) => assert.throws(fn, (error) => error.status === 400);

test('orders preserve leading-zero phones and normalise whitespace and IDs', () => {
  const result = normaliseOrder(order());
  assert.equal(result.name, 'Ava');
  assert.equal(result.phone, '007123456789');
  assert.equal(result.items[0].quantity, 2);
  assert.ok(result.items[0].lessonId.equals(recordId(id)));
});

test('orders reject invalid contact details, quantities, duplicates and injection', () => {
  for (const name of ['', 'Ava Smith', 'Ava2', '<script>']) invalid(() => normaliseOrder({ ...order(), name }));
  for (const phone of ['', 7123456789, '+447123', '12 34']) invalid(() => normaliseOrder({ ...order(), phone }));
  for (const quantity of [0, -1, 1.2, '2', Number.MAX_SAFE_INTEGER + 1]) invalid(() => normaliseOrder({ ...order(), items: [{ lessonId: id, quantity }] }));
  invalid(() => normaliseOrder({ ...order(), items: [{ lessonId: { $ne: null }, quantity: 1 }] }));
  invalid(() => normaliseOrder({ ...order(), items: [...order().items, ...order().items] }));
  invalid(() => normaliseOrder({ ...order(), items: [] }));
  invalid(() => normaliseOrder({ ...order(), requestId: 'not-a-uuid' }));
});

test('PUT can set absolute spaces and every editable lesson attribute', () => {
  const { updates } = normaliseUpdates({ updates: [{ lessonId: id, changes: { topic: 'Drama', location: 'Hendon', price: 100, space: 12, image: '/images/drama.svg' } }] });
  assert.equal(updates[0].changes.space, 12);
  assert.equal(updates[0].changes.price, 100);
  assert.equal(updates[0].changes.topic, 'Drama');
});

test('PUT rejects negative/fractional stock, nonnumeric prices and forbidden fields', () => {
  for (const changes of [{ space: -1 }, { space: 0.5 }, { price: '9' }, { price: Infinity }, { _id: id }, { $inc: { space: 1 } }, { image: '/images/../private.svg' }, {}]) {
    invalid(() => normaliseUpdates({ updates: [{ lessonId: id, changes }] }));
  }
  invalid(() => normaliseUpdates({ updates: [] }));
  invalid(() => normaliseUpdates({ updates: [{ lessonId: 'bad', changes: { space: 0 } }] }));
  invalid(() => normaliseUpdates({ updates: [{ lessonId: id, changes: { space: 0 } }], orderId: null }));
});
