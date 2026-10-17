import { createServer } from 'node:http';

export function createHttpServer(app) {
  // Render can reuse an idle upstream connection for 75 seconds. Node's
  // five-second default closes it too early, causing proxy retries/stalls.
  // https://render.com/tutorials/when-deploys-go-wrong/runtime-errors
  return createServer({ keepAliveTimeout: 120000, headersTimeout: 120000 }, app);
}
