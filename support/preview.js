// Explicit local test preview. This is never imported by the production server.
import express from "express";
import { fileURLToPath } from "node:url";
import { createApp } from "../src/app.js";
import { fixtures } from "./fixtures.js";
import { testDatabase } from "./test-database.js";
import { readAdminConfig } from "../src/config.js";

const { db, client } = testDatabase(await fixtures());
const port = Number(process.env.PREVIEW_PORT || 8081);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('PREVIEW_PORT must be an integer from 1024 to 65535.');
const origin = 'http://127.0.0.1:' + port;
const server = express();
server.get("/config.js", (_req, res) =>
  res
    .type("application/javascript")
    .send(
      'window.AFTERCLASS_CONFIG = ' + JSON.stringify({apiBaseUrl:origin,testPreview:true}) + ';',
    ),
);
server.use(
  express.static(fileURLToPath(new URL("../../frontend/", import.meta.url))),
);
server.use(
  createApp({
    db,
    client,
    admin: readAdminConfig(),
    allowedOrigins: [origin, 'http://localhost:' + port],
  }),
);
const listener = server.listen(port, "127.0.0.1", () => {
  console.info(
    'TEST PREVIEW — in-memory fixtures, NOT Atlas. Data resets on restart. ' + origin,
  );
});
listener.on("error", () => {
  console.error('Test preview port ' + port + ' is unavailable.');
  process.exitCode = 1;
});
process.on("SIGTERM", () => listener.close());
process.on("SIGINT", () => listener.close());
