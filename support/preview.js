// Explicit local test preview. This is never imported by the production server.
import express from 'express';
import { fileURLToPath } from 'node:url';
import { createApp } from '../src/app.js';
import { fixtures } from './fixtures.js';
import { testDatabase } from './test-database.js';
import { readAdminConfig } from '../src/config.js';

const { db, client } = testDatabase(await fixtures());
const server = express();
server.get('/config.js', (_req, res) => res.type('application/javascript').send(
  'window.AFTERCLASS_CONFIG = {apiBaseUrl:"http://127.0.0.1:8081", testPreview:true};',
));
server.use(express.static(fileURLToPath(new URL('../../frontend/', import.meta.url))));
server.use(createApp({ db, client, admin: readAdminConfig(), allowedOrigins: ['http://127.0.0.1:8081', 'http://localhost:8081'] }));
const listener = server.listen(8081, '127.0.0.1', () => {
  console.info('TEST PREVIEW — in-memory fixtures, NOT Atlas. Data resets on restart. http://127.0.0.1:8081');
});
listener.on('error', () => { console.error('Test preview port 8081 is unavailable.'); process.exitCode = 1; });
process.on('SIGTERM', () => listener.close());
process.on('SIGINT', () => listener.close());
