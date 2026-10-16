import assert from 'node:assert/strict';
import { test } from 'node:test';
import { restoreSaved, category, discoveryFilter, artTone } from '../discovery.mjs';
const a = { _id: '100000000000000000000001', topic: 'Coding Club', available: 4 };
const b = { _id: '100000000000000000000002', topic: 'Art Workshop', available: 0 };
test('saved activity storage ignores corrupt IDs and removes duplicates', () => {
  assert.deepEqual(restoreSaved({ getItem: () => JSON.stringify([a._id, a._id, 'invalid']) }), [a._id]);
  assert.deepEqual(restoreSaved({ getItem: () => '{' }), []);
});
test('discovery filters intersect without changing source lessons or basket state', () => {
  const lessons = [a, b];
  assert.deepEqual(discoveryFilter(lessons, { savedOnly: true, savedIds: [b._id] }), [b]);
  assert.deepEqual(discoveryFilter(lessons, { savedOnly: true, savedIds: [b._id], availableOnly: true }), []);
  assert.deepEqual(discoveryFilter(lessons, { selectedCategory: 'STEM & strategy' }), [a]);
  assert.equal(category('Guitar Basics'), 'Arts & expression');
  assert.equal(category('Ballet Beginners'), 'Move & play');
  assert.equal(category('French Discovery'), 'Language & discovery');
  assert.equal(lessons.length, 2);
  assert.equal(artTone(a._id), artTone(a._id));
});
