import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { test } from 'node:test';
import { updateLessons } from '../src/updates.js';
import { testDatabase } from '../support/test-database.js';

const a = new ObjectId('100000000000000000000001');
const b = new ObjectId('100000000000000000000002');
const setup = () => testDatabase({ lesson: [{ _id: a, topic: 'Maths', price: 9, space: 5 }, { _id: b, topic: 'Art', price: 20, space: 5 }] });
const update = (id, changes) => ({ lessonId: id.toHexString(), changes });

test('PUT changes any editable field and sets spaces to an absolute number', async () => {
  const { db, client, state } = setup();
  await updateLessons(db, client, { updates: [update(a, { topic: 'Science', location: 'Hendon', price: 100, space: 12, image: '/images/science.svg' })] });
  assert.equal(state.lesson[0].space, 12);
  assert.equal(state.lesson[0].topic, 'Science');
  await updateLessons(db, client, { updates: [update(a, { space: 0 })] });
  assert.equal(state.lesson[0].space, 0);
});

test('a missing lesson prevents all updates in the batch', async () => {
  const { db, client, state } = setup();
  await assert.rejects(updateLessons(db, client, { updates: [update(a, { space: 1 }), update(new ObjectId(), { space: 2 })] }), (error) => error.status === 404);
  assert.equal(state.lesson[0].space, 5);
});

test('a write failure rolls back earlier changes', async () => {
  const { db, client, state, controls } = setup();
  controls.failOnUpdate = 2;
  await assert.rejects(updateLessons(db, client, { updates: [update(a, { space: 1 }), update(b, { space: 1 })] }), /Simulated write failure/);
  assert.deepEqual(state.lesson.map((lesson) => lesson.space), [5, 5]);
});
