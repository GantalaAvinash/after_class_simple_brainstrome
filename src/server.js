import { createApp } from './app.js';
import { readConfig } from './config.js';
import { connectDatabase } from './database.js';

try {
  const config = readConfig();
  const { client, db } = await connectDatabase(config);
  const server = createApp({ db, allowedOrigins: config.allowedOrigins })
    .listen(config.port, '0.0.0.0', () => console.info(`AfterClass API listening on port ${config.port}`));
  server.on('error', async () => {
    console.error('The API could not start. Check that its port is available.');
    await client.close();
    process.exitCode = 1;
  });

  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => process.exit(1), 10000).unref();
    server.close(async () => {
      await client.close();
      clearTimeout(deadline);
      process.exitCode = 0;
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
