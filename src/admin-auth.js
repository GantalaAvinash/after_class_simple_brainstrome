import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { HttpError, requireValue } from './errors.js';

const derive = promisify(scrypt);
const SCRYPT = { N: 131072, r: 8, p: 1, maxmem: 192 * 1024 * 1024 };
const SESSION_MS = 30 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LIMIT = 10;
const digest = (value) => createHash('sha256').update(value).digest('hex');

export async function hashPassword(password) {
  requireValue(typeof password === 'string' && password.length >= 15 && password.length <= 128, 'Choose a password between 15 and 128 characters.');
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt, 64, SCRYPT);
  return 'scrypt-v1:' + salt + ':' + key.toString('hex');
}

export function validPasswordHash(value) {
  return typeof value === 'string' && /^scrypt-v1:[a-f0-9]{32}:[a-f0-9]{128}$/.test(value);
}

export function createAdminAuth(db, { username = '', passwordHash = '' } = {}) {
  const configured = /^[a-z0-9_-]{3,40}$/.test(username) && validPasswordHash(passwordHash);
  const credentialVersion = digest(username + ':' + passwordHash);
  async function login(body) {
    requireValue(configured, 'Admin sign-in has not been configured.', 503);
    const now = Date.now();
    const bucket = Math.floor(now / LOGIN_WINDOW_MS);
    // A database counter remains effective across processes and restarts. Count
    // every attempt, including unknown usernames; never trust proxy IP headers.
    const count = await db.collection('adminLoginAttempt').findOneAndUpdate(
      { _id: 'login:' + bucket },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 1) * LOGIN_WINDOW_MS) } },
      { upsert: true, returnDocument: 'after' },
    );
    if (count.count > LOGIN_LIMIT) {
      const error = new HttpError(429, 'Too many sign-in attempts. Please try again later.');
      error.retryAfter = Math.ceil(((bucket + 1) * LOGIN_WINDOW_MS - now) / 1000);
      throw error;
    }
    requireValue(body && typeof body.username === 'string' && typeof body.password === 'string' && body.password.length <= 128 && Object.keys(body).every((key) => ['username', 'password'].includes(key)), 'Check your admin username and password.', 401);
    const [, salt, expected] = passwordHash.split(':');
    const key = await derive(body.password, salt, 64, SCRYPT);
    const correctPassword = timingSafeEqual(key, Buffer.from(expected, 'hex'));
    requireValue(correctPassword && body.username === username, 'Check your admin username and password.', 401);
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(now + SESSION_MS);
    await db.collection('adminSession').insertOne({ _id: digest(token), username, credentialVersion, expiresAt });
    return { token, username, expiresAt };
  }
  async function authenticate(header) {
    requireValue(configured && typeof header === 'string' && /^Bearer [a-f0-9]{64}$/.test(header), 'Admin sign-in is required.', 401);
    const session = await db.collection('adminSession').findOne({ _id: digest(header.slice(7)) });
    requireValue(session && session.expiresAt > new Date() && session.credentialVersion === credentialVersion, 'Your admin session has expired. Sign in again.', 401);
    return session;
  }
  const guard = async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    req.admin = await authenticate(req.get('Authorization'));
    next();
  };
  return { login, authenticate, guard };
}

export function registerAdminSessionRoutes(app, db, auth) {
  app.use('/admin', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.post('/admin/session', async (req, res) => res.status(201).json(await auth.login(req.body)));
  app.get('/admin/session', auth.guard, (req, res) => res.json({ username: req.admin.username, expiresAt: req.admin.expiresAt }));
  app.delete('/admin/session', auth.guard, async (req, res) => {
    await db.collection('adminSession').updateOne({ _id: req.admin._id }, { $set: { expiresAt: new Date(0) } });
    res.json({ signedOut: true });
  });
}
