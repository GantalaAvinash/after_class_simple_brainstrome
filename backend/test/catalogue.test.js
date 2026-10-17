import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ObjectId } from 'mongodb';
import { findLessons } from '../src/catalogue.js';
import { testDatabase } from '../support/test-database.js';

const a = new ObjectId('100000000000000000000001');
const b = new ObjectId('100000000000000000000002');
const teacherId = new ObjectId('200000000000000000000001');
const { db } = testDatabase({
  lesson: [
    { _id: a, topic: 'Maths', location: 'Hendon', price: 100, space: 5 },
    { _id: b, topic: 'Art [Studio]', location: 'Colindale', price: 9, space: 2 },
  ],
  teacher: [{ _id: teacherId, firstName: 'Mina', lastName: 'Patel', lessonIds: [a] }],
});

test('server search covers subject, location, numeric prices and spaces with literal matching', async () => {
  for (const q of ['math', 'HENDON', '10', '5']) assert.equal((await findLessons(db, { q }))[0]._id.toHexString(), a.toHexString());
  assert.equal((await findLessons(db, { q: '[' })).length, 1);
  assert.equal((await findLessons(db, { q: 'no such lesson' })).length, 0);
  assert.equal((await findLessons(db, { q: '   ' })).length, 2);
});

test('teacher and search filters intersect and malformed IDs are rejected', async () => {
  assert.equal((await findLessons(db, { teacherId: teacherId.toHexString() })).length, 1);
  assert.equal((await findLessons(db, { teacherId: teacherId.toHexString(), q: 'Art' })).length, 0);
  await assert.rejects(findLessons(db, { teacherId: 'bad' }), (error) => error.status === 400);
  await assert.rejects(findLessons(db, { teacherId: new ObjectId().toHexString() }), (error) => error.status === 404);
  await assert.rejects(findLessons(db, { q: ['a', 'b'] }), (error) => error.status === 400);
});
