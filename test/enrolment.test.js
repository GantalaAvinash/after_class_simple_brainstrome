import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { test } from 'node:test';
import { getEnrolment } from '../src/enrolment.js';
import { testDatabase } from '../support/test-database.js';

test('enrolment sums purchased quantities, ignores pending orders and does not depend on spaces', async () => {
  const a = new ObjectId(), b = new ObjectId();
  const { db, state } = testDatabase({
    lesson: [{ _id: a, space: 100 }, { _id: b, space: 5 }],
    order: [
      { _id: new ObjectId(), status: 'confirmed', items: [{ lessonId: a, quantity: 2 }, { lessonId: b, quantity: 1 }] },
      { _id: new ObjectId(), status: 'confirmed', items: [{ lessonId: a, quantity: 1 }] },
      { _id: new ObjectId(), status: 'pending', items: [{ lessonId: a, quantity: 4 }] },
    ],
  });
  assert.equal((await getEnrolment(db, a.toHexString())).enrolment, 3);
  state.lesson[0].space = 0;
  assert.equal((await getEnrolment(db, a.toHexString())).enrolment, 3);
  assert.equal((await getEnrolment(db, b.toHexString())).enrolment, 1);
  await assert.rejects(getEnrolment(db, new ObjectId().toHexString()), (error) => error.status === 404);
});

test('an unpurchased lesson returns zero', async () => {
  const id = new ObjectId();
  const { db } = testDatabase({ lesson: [{ _id: id, space: 5 }] });
  assert.equal((await getEnrolment(db, id.toHexString())).enrolment, 0);
});
