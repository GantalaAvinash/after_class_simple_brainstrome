import assert from 'node:assert/strict';
import { Agent, get } from 'node:http';
import { test } from 'node:test';
import { createHttpServer } from '../src/http-server.js';

test('the production listener preserves a proxy connection beyond Node’s default idle cutoff', { timeout: 15000 }, async t => {
  const server = createHttpServer((_req, res) => res.end('ok'));
  server.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const agent = new Agent({ keepAlive: true, maxSockets: 1 });
  t.after(async () => { agent.destroy(); await new Promise(resolve => server.close(resolve)); });
  const read = () => new Promise((resolve, reject) => {
    const request = get({ hostname: '127.0.0.1', port: server.address().port, path: '/', agent }, response => {
      const socket = response.socket;
      response.resume();
      response.on('end', () => resolve({ socket, reused: request.reusedSocket, keepAlive: response.headers['keep-alive'] }));
    });
    request.on('error', reject);
  });
  const first = await read();
  assert.match(first.keepAlive, /timeout=120(?:,|$)/);
  await new Promise(resolve => setTimeout(resolve, 6100));
  const second = await read();
  assert.equal(second.reused, true);
  assert.equal(second.socket, first.socket);
});
