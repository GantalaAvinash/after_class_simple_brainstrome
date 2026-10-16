import { recordId } from './validation.js';
import { requireValue } from './errors.js';

export async function getEnrolment(db, id) {
  const lessonId = recordId(id);
  requireValue(await db.collection('lesson').findOne({ _id: lessonId }), 'Lesson not found.', 404);
  const orders = await db.collection('order').find({
    status: 'confirmed', 'items.lessonId': lessonId,
  }, { projection: { items: 1 } }).toArray();
  const enrolment = orders.reduce((total, order) => total + order.items
    .filter((item) => item.lessonId.equals(lessonId))
    .reduce((sum, item) => sum + item.quantity, 0), 0);
  return { lessonId, enrolment };
}

export function registerEnrolmentRoute(app, db) {
  app.get('/enrolment/:lessonid', async (req, res) => res.json(await getEnrolment(db, req.params.lessonid)));
}
