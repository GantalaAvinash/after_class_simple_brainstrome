export function requestLogger(write = console.info) {
  return (req, res, next) => {
    const start = performance.now();
    res.on("finish", () =>
      write(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          durationMs: Number((performance.now() - start).toFixed(1)),
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
    if (origin) res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  };
}
