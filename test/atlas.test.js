import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { MongoClient, ObjectId } from 'mongodb';
import { test } from 'node:test';
import { createPendingOrder, orderResponse } from '../src/orders.js';
import { updateLessons } from '../src/updates.js';
import { getEnrolment } from '../src/enrolment.js';

test('REAL ATLAS: rollback, last-place concurrency, idempotency and enrolment', { skip: !process.env.MONGODB_TEST_URI }, async (t) => {
  const databaseName = process.env.MONGODB_TEST_DATABASE || 'afterclass_test';
  assert.match(databaseName, /^[A-Za-z0-9_-]+_test$/, 'Test database name must end in _test.');
  assert.notEqual(databaseName, process.env.DATABASE_NAME || 'afterclass', 'Tests must not use the assessment database.');
  const client = new MongoClient(process.env.MONGODB_TEST_URI, { serverSelectionTimeoutMS: 10000 });
  try { await client.connect(); } catch { await client.close(); throw new Error('Atlas test connection failed. Check the test URI and access list.'); }
  const db = client.db(databaseName);
  const a = new ObjectId(), b = new ObjectId();
  const requestIds = [];
  t.after(async () => {
    try {
      await db.collection('order').deleteMany({ requestId: { $in: requestIds } });
      await db.collection('lesson').deleteMany({ _id: { $in: [a, b] } });
    } finally { await client.close(); }
  });
  await db.collection('lesson').insertMany([{ _id: a, topic: 'Maths', price: 9, space: 5 }, { _id: b, topic: 'Art', price: 20, space: 5 }]);
  await db.collection('order').createIndex({ requestId: 1 }, { unique: true });
  const payload = (items) => {
    const requestId = randomUUID();
    requestIds.push(requestId);
    return { requestId, name: 'Ava', phone: '007123', items: items.map(([id, quantity]) => ({ lessonId: id.toHexString(), quantity })) };
  };
  const make = async (body) => {
    const { order } = await createPendingOrder(db, body);
    return JSON.parse(JSON.stringify({ orderId: order._id, updates: orderResponse(order).updates }));
  };
  const failed = await make(payload([[a, 2], [b, 2]]));
  await db.collection('lesson').updateOne({ _id: b }, { $set: { space: 0 } });
  await assert.rejects(updateLessons(db, client, failed), (error) => error.status === 409);
  assert.equal((await db.collection('lesson').findOne({ _id: a })).space, 5);
  await db.collection('lesson').updateOne({ _id: a }, { $set: { space: 1 } });
  const body = payload([[a, 1]]);
  const first = await make(body), second = await make(payload([[a, 1]]));
  const results = await Promise.allSettled([updateLessons(db, client, first), updateLessons(db, client, second)]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  const winner = results[0].status === 'fulfilled' ? first : second;
  await updateLessons(db, client, winner);
  assert.equal((await db.collection('lesson').findOne({ _id: a })).space, 0);
  assert.equal((await getEnrolment(db, a.toHexString())).enrolment, 1);
  if (winner === first) assert.equal((await createPendingOrder(db, body)).order.status, 'confirmed');
});
