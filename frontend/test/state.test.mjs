import assert from 'node:assert/strict';
import { test } from 'node:test';
import { availableSpace, sortLessons, changeCart, cartLines, contactErrors } from '../state.mjs';

const lessons = [
  { _id: 'a', topic: 'Art', location: 'Zetland', price: 100, space: 5 },
  { _id: 'b', topic: 'Coding', location: 'Hendon', price: 9, space: 2 },
  { _id: 'c', topic: 'Ballet', location: 'Colindale', price: 20, space: 3 },
];
const byId = Object.fromEntries(lessons.map((lesson) => [lesson._id, lesson]));

test('all eight sorting combinations are correct and do not mutate source data', () => {
  const expected = { topic: ['a', 'c', 'b'], location: ['c', 'b', 'a'], price: ['b', 'c', 'a'], space: ['b', 'c', 'a'] };
  for (const [field, ids] of Object.entries(expected)) {
    assert.deepEqual(sortLessons(lessons, {}, field, 'asc').map((lesson) => lesson._id), ids);
    assert.deepEqual(sortLessons(lessons, {}, field, 'desc').map((lesson) => lesson._id), ids.toReversed());
  }
  assert.deepEqual(lessons.map((lesson) => lesson._id), ['a', 'b', 'c']);
});

test('five additions exhaust a lesson, sixth is ignored, and removal restores one place', () => {
  let cart = {};
  for (let i = 0; i < 6; i++) cart = changeCart(byId, cart, 'a', 1);
  assert.equal(cart.a, 5);
  assert.equal(availableSpace(byId.a, cart), 0);
  cart = changeCart(byId, cart, 'a', -1);
  assert.equal(cart.a, 4);
  assert.equal(availableSpace(byId.a, cart), 1);
  assert.equal(byId.a.space, 5);
});

test('removal deletes the last place and a filtered catalogue cannot reset cart quantities', () => {
  const cart = changeCart(byId, {}, 'a', 1);
  sortLessons([byId.b], cart, 'space');
  assert.equal(cartLines(byId, cart)[0].topic, 'Art');
  assert.deepEqual(changeCart(byId, cart, 'a', -1), {});
  assert.deepEqual(changeCart(byId, {}, 'missing', 1), {});
});

test('availability reflects refreshed stock and numeric space sorting reflects the basket', () => {
  assert.equal(availableSpace({ ...byId.a, space: 1 }, { a: 3 }), 0);
  assert.equal(sortLessons(lessons, { a: 5 }, 'space')[0]._id, 'a');
});

test('contact validation accepts leading zeros and rejects invalid or missing input', () => {
  assert.deepEqual(contactErrors(' Ava ', '00712345'), { name: '', phone: '' });
  for (const name of ['', 'Ava Smith', 'Ava2', 'Ava-Smith']) assert.ok(contactErrors(name, '007').name);
  for (const phone of ['', '+447123', '12 34', '1e10']) assert.ok(contactErrors('Ava', phone).phone);
});
