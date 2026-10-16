import express from 'express';
import { fileURLToPath } from 'node:url';
import { cors, requestLogger } from './middleware.js';
import { HttpError } from './errors.js';
import { registerCatalogueRoutes } from './catalogue.js';
import { registerOrderRoutes } from './orders.js';
import { registerUpdateRoute } from './updates.js';
import { registerEnrolmentRoute } from './enrolment.js';

export function createApp({ db, client, allowedOrigins, logger }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(requestLogger(logger));
  app.use(cors(allowedOrigins));
  app.use(express.json({ limit: '20kb' }));
  app.use('/images', express.static(fileURLToPath(new URL('../public/images/', import.meta.url)), {
    index: false, dotfiles: 'deny', redirect: false,
  }));
  app.use('/images', (_req, res) => res.status(404).json({ error: 'Lesson image not found.' }));

  app.get('/health', async (_req, res) => {
    try {
      await db.command({ ping: 1 });
      res.json({ status: 'ok', database: 'connected' });
    } catch {
      res.status(503).json({ error: 'The database is temporarily unavailable.' });
    }
  });

  registerCatalogueRoutes(app, db);
  registerOrderRoutes(app, db);
  registerUpdateRoute(app, db, client);
  registerEnrolmentRoute(app, db);

  app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));
  app.use((error, _req, res, _next) => {
    if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'The request body must be valid JSON.' });
    }
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ error: 'The request body is too large.' });
    }
    res.status(500).json({ error: 'The request could not be completed.' });
  });
  return app;
}
