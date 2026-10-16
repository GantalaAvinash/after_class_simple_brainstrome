import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApp } from '../src/app.js';

test('static middleware serves real SVGs and explicit missing-image errors', async (t) => {
  const logs = [];
  const server = createApp({ db: {}, allowedOrigins: [], logger: (line) => logs.push(JSON.parse(line)) }).listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = 'http://127.0.0.1:' + server.address().port;
  const image = await fetch(base + '/images/maths.svg');
  assert.equal(image.status, 200);
  assert.match(image.headers.get('content-type'), /image\/svg\+xml/);
  assert.match(await image.text(), /<svg/);
  const missing = await fetch(base + '/images/not-present.svg');
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { error: 'Lesson image not found.' });
  assert.equal(logs.find((entry) => entry.url.endsWith('not-present.svg')).status, 404);
});
