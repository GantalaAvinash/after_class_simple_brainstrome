import { requireValue } from './errors.js';
import { normaliseUpdates } from './validation.js';

export async function transaction(client, work) {
  requireValue(client?.startSession, 'Database writes are temporarily unavailable.', 503);
  const session = client.startSession();
  try { return await session.withTransaction(() => work(session)); }
  finally { await session.endSession(); }
}

export async function applyGeneralUpdates(db, client, updates) {
  return transaction(client, async (session) => {
    const lessons = db.collection('lesson');
    for (const update of updates) {
      requireValue(await lessons.findOne({ _id: update.lessonId }, { session }), 'Lesson not found.', 404);
    }
    for (const update of updates) {
      const result = await lessons.updateOne({ _id: update.lessonId }, { $set: update.changes }, { session });
      requireValue(result.matchedCount === 1, 'A lesson changed during the update. Please retry.', 409);
    }
    return { lessons: await lessons.find({ _id: { $in: updates.map((update) => update.lessonId) } }, { session }).toArray() };
  });
}

export async function updateLessons(db, client, body) {
  const { updates, orderId } = normaliseUpdates(body);
  requireValue(!orderId, 'Use a general lesson update without an order ID.');
  return applyGeneralUpdates(db, client, updates);
}

export function registerUpdateRoute(app, db, client) {
  app.put('/lessons', async (req, res) => res.json(await updateLessons(db, client, req.body)));
}
