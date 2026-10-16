export function readConfig(env = process.env) {
  const uri = env.MONGODB_URI?.trim();
  if (!uri || !/^mongodb(?:\+srv)?:\/\//.test(uri)) {
    throw new Error('Set a valid MONGODB_URI in backend/.env or Render environment variables.');
  }

  const port = Number(env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  const databaseName = env.DATABASE_NAME?.trim() || 'afterclass';
  if (!/^[A-Za-z0-9_-]+$/.test(databaseName)) {
    throw new Error('DATABASE_NAME must contain only letters, numbers, underscores, or hyphens.');
  }

  const allowedOrigins = (env.FRONTEND_ORIGINS || 'http://localhost:8080,http://127.0.0.1:8080')
    .split(',').map((origin) => origin.trim()).filter(Boolean);
  for (const origin of allowedOrigins) {
    const url = new URL(origin);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) {
      throw new Error('FRONTEND_ORIGINS must contain complete origins without paths or trailing slashes.');
    }
  }

  return { uri, port, databaseName, allowedOrigins };
}
