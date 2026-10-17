import express from "express";
import { fileURLToPath } from "node:url";
import { cors, requestLogger } from "./middleware.js";
import { HttpError } from "./errors.js";
import { registerCatalogueRoutes } from "./catalogue.js";
import { registerOrderRoutes } from "./orders.js";
import { registerUpdateRoute } from "./updates.js";
import { registerEnrolmentRoute } from "./enrolment.js";
import { createAdminAuth, registerAdminSessionRoutes } from "./admin-auth.js";
import { registerAdminRoutes } from "./admin.js";
import { registerTeacherAdminRoutes } from './teachers.js';

export function createApp({ db, client, allowedOrigins, logger, admin }) {
  const app = express();
  app.disable("x-powered-by");
  app.use(requestLogger(logger));
  app.use(cors(allowedOrigins));
  // Simple form encoding avoids a needless preflight before password checking.
  // Existing JSON clients remain supported; both paths use the same validator.
  app.use('/admin/session', express.urlencoded({ extended: false, limit: '20kb', parameterLimit: 3 }));
  app.use(express.json({ limit: "20kb" }));
  app.use(
    "/images",
    express.static(
      fileURLToPath(new URL("../public/images/", import.meta.url)),
      {
        index: false,
        dotfiles: "deny",
        redirect: false,
      },
    ),
  );
  app.use("/images", (_req, res) =>
    res.status(404).json({ error: "Lesson image not found." }),
  );

  // Availability and sessions must never be restored from a browser/proxy cache.
  // Static lesson images retain their separate caching behaviour above.
  app.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });

  app.get("/health", async (_req, res) => {
    try {
      await db.command({ ping: 1 });
      res.json({ status: "ok", database: "connected" });
    } catch {
      res
        .status(503)
        .json({ error: "The database is temporarily unavailable." });
    }
  });

  registerCatalogueRoutes(app, db);
  registerOrderRoutes(app, db);
  const auth = createAdminAuth(db, admin);
  registerAdminSessionRoutes(app, db, auth);
  registerAdminRoutes(app, db, client, auth.guard);
  registerTeacherAdminRoutes(app, db, client, auth.guard);
  registerUpdateRoute(app, db, client, auth.guard);
  registerEnrolmentRoute(app, db);

  app.use((_req, res) => res.status(404).json({ error: "Route not found." }));
  app.use((error, _req, res, _next) => {
    if (error instanceof HttpError) {
      if (error.retryAfter) res.set("Retry-After", String(error.retryAfter));
      return res.status(error.status).json({ error: error.message });
    }
    if (error.type === "entity.parse.failed") {
      return res
        .status(400)
        .json({ error: "The request body must be valid JSON." });
    }
    if (["entity.too.large", "parameters.too.many"].includes(error.type)) {
      return res.status(413).json({ error: "The request body is too large." });
    }
    res.status(500).json({ error: "The request could not be completed." });
  });
  return app;
}
