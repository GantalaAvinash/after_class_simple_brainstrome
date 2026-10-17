import { randomUUID } from 'node:crypto';

export function requestLogger(write = console.info) {
  return (req, res, next) => {
    const start = performance.now();
    const startedAt = new Date().toISOString();
    const requestId = randomUUID();
    req.timings = [];
    res.set('X-Request-Id', requestId);
    const writeHead = res.writeHead;
    res.writeHead = function (...args) {
      const timings = [...req.timings, { name: 'app', durationMs: performance.now() - start }];
      res.setHeader('Server-Timing', timings.map(({ name, durationMs }) => name + ';dur=' + durationMs.toFixed(1)).join(', '));
      return writeHead.apply(this, args);
    };
    res.on("finish", () =>
      write(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          startedAt,
          requestId,
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          durationMs: Number((performance.now() - start).toFixed(1)),
          timings: req.timings,
        }),
      ),
    );
    next();
  };
}

export function cors(allowedOrigins) {
  return (req, res, next) => {
    const origin = req.get("Origin");
    res.vary("Origin");
    if (origin && !allowedOrigins.includes(origin)) {
      return res
        .status(403)
        .json({ error: "This browser origin is not allowed." });
    }
    if (origin) {
      res.set("Access-Control-Allow-Origin", origin);
      res.set("Timing-Allow-Origin", origin);
      res.set("Access-Control-Expose-Headers", "X-Request-Id, Server-Timing");
    }
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      // Return an explicit empty permission response without an entity ETag.
      // Cache only the permission decision;
      // authentication and database reads still run on every real request.
      res.set("Access-Control-Max-Age", "600");
      return res.status(200).set("Content-Length", "0").end();
    }
    next();
  };
}
