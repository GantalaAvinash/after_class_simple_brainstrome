import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyLesson, lessonErrors, mutationAttempt, restoreAdminAttempt, createAdminClient } from '../admin-state.mjs';

const draft = { ...emptyLesson(), topic: 'Robotics', location: 'Hendon', price: '9.50', space: '5' };
test('admin forms normalise numeric fields and require strict valid lesson values', () => {
  assert.deepEqual(lessonErrors(draft), {});
  for (const fields of [{ topic: '' }, { price: '-1' }, { price: '9.111' }, { price: '' }, { space: '1.5' }, { space: '' }, { image: 'https://example.com/a.svg' }]) assert.ok(Object.keys(lessonErrors({ ...draft, ...fields })).length);
  const attempt = mutationAttempt('create', null, draft);
  assert.equal(attempt.body.lesson.price, 9.5);
  assert.equal(attempt.body.lesson.space, 5);
  assert.equal(attempt.path, '/admin/lessons');
});
test('admin edits retain revision and retry IDs without serialising credentials', () => {
  const attempt = mutationAttempt('update', { _id: '100000000000000000000001', revision: 7 }, draft);
  const restored = restoreAdminAttempt({ getItem: () => JSON.stringify(attempt) });
  assert.deepEqual(restored, attempt);
  assert.equal(restored.body.revision, 7);
  assert.ok(!JSON.stringify(attempt).includes('token'));
  assert.equal(restoreAdminAttempt({ getItem: () => JSON.stringify({ ...attempt, path: '/orders' }), removeItem() {} }), null);
});
test('admin tokens stay in the client closure and clear on expiry or sign-out', async () => {
  const calls = []; let expired = false;
  const client = createAdminClient(async (path, options) => {
    calls.push({ path, options });
    if (path === '/admin/session') return { token: 'a'.repeat(64), username: 'operator', expiresAt: '2026-10-16T20:00:00Z' };
    if (path === '/admin/expired') throw Object.assign(new Error('expired'), { status: 401 });
    return {};
  }, () => { expired = true; });
  await assert.rejects(client.request('/admin/lessons'), /Sign in/);
  const session = await client.login('operator', 'private-password');
  assert.equal(session.token, undefined);
  await client.request('/admin/lessons');
  assert.equal(calls[1].options.token, 'a'.repeat(64));
  await assert.rejects(client.request('/admin/expired'));
  assert.equal(expired, true);
  await assert.rejects(client.request('/admin/lessons'), /Sign in/);
  await client.login('operator', 'private-password'); client.clear();
  await assert.rejects(client.request('/admin/lessons'), /Sign in/);
});
