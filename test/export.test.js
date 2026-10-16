import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BSON, ObjectId } from 'mongodb';
import { exportFilename, serialiseCollection } from '../src/export-data.js';

test('exports preserve MongoDB IDs, dates and quantities for re-import', () => {
  const id = new ObjectId(), createdAt = new Date('2026-10-16T00:00:00Z');
  const output = serialiseCollection([{ _id: id, createdAt, items: [{ lessonId: id, quantity: 2 }] }]);
  const restored = BSON.EJSON.parse(output);
  assert.ok(restored[0]._id.equals(id));
  assert.equal(restored[0].createdAt.toISOString(), createdAt.toISOString());
  assert.equal(Number(restored[0].items[0].quantity), 2);
  assert.equal(exportFilename('../private'), '..%2Fprivate.json');
});
