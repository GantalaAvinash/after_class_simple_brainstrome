import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApi, resolveApiBase } from '../api.mjs';

test('local defaults and hosted API addresses are safe origins', () => {
  assert.equal(resolveApiBase('', { hostname: 'localhost' }), 'http://localhost:3000');
  assert.equal(resolveApiBase('https://afterclass.onrender.com/', { hostname: 'example.github.io' }), 'https://afterclass.onrender.com');
  for (const value of ['', 'http://localhost:3000', 'https://user:secret@example.com', 'https://example.com/path', 'https://example.com/?token=secret']) {
    assert.throws(() => resolveApiBase(value, { hostname: 'example.github.io' }));
  }
});

test('POST and PUT send JSON and HTTP errors retain their status', async () => {
  const calls = [];
  const api = createApi('https://api.example', async (url, options) => {
    calls.push({ url, ...options });
    return new Response(JSON.stringify({ error: 'Availability changed.' }), { status: 409 });
  });
  await assert.rejects(api('/orders', { method: 'POST', body: { name: 'Ava' } }), (error) => error.status === 409);
  await assert.rejects(api('/lessons', { method: 'PUT', body: { updates: [] } }), (error) => error.status === 409);
  assert.equal(calls[0].headers['Content-Type'], 'application/json');
  assert.equal(JSON.parse(calls[0].body).name, 'Ava');
  assert.equal(calls[1].method, 'PUT');
});

test('network failures and malformed success responses produce readable errors', async () => {
  await assert.rejects(createApi('', async () => { throw new TypeError('network'); })('/lessons'), /Unable to reach/);
  await assert.rejects(createApi('', async () => new Response('not json'))('/lessons'), /unexpected response/);
});
