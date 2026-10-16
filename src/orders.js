import { createHash } from 'node:crypto';
import { normaliseOrder } from './validation.js';
import { requireValue } from './errors.js';

export function orderResponse(order) {
  return {
    orderId: order._id,
    status: order.status,
    updates: order.items.map((item) => ({ lessonId: item.lessonId, changes: { space: item.spaceAfter } })),
  };
}

function replay(existing, fingerprint) {
  requireValue(existing.payloadHash === fingerprint, 'This checkout request ID was already used with different details.', 409);
  return { order: existing, created: false };
}

export async function createPendingOrder(db, body) {
  const input = normaliseOrder(body);
  const fingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const orders = db.collection('order');
  const existing = await orders.findOne({ requestId: input.requestId });
  if (existing) return replay(existing, fingerprint);

  const items = [];
  for (const item of input.items) {
    const lesson = await db.collection('lesson').findOne({ _id: item.lessonId });
    requireValue(lesson, 'A selected lesson no longer exists.', 404);
    requireValue(lesson.space >= item.quantity, 'There are not enough spaces for ' + lesson.topic + '. Please refresh your basket.', 409);
    items.push({ ...item, unitPrice: lesson.price, spaceBefore: lesson.space, spaceAfter: lesson.space - item.quantity });
  }
  const order = { ...input, items, payloadHash: fingerprint, status: 'pending', createdAt: new Date() };
  try {
    const result = await orders.insertOne(order);
    return { order: { ...order, _id: result.insertedId }, created: true };
  } catch (error) {
    // The unique requestId index resolves simultaneous retries of the same POST.
    if (error.code !== 11000) throw error;
    const winner = await orders.findOne({ requestId: input.requestId });
    if (!winner) throw error;
    return replay(winner, fingerprint);
  }
}

export function registerOrderRoutes(app, db) {
  app.post('/orders', async (req, res) => {
    const { order, created } = await createPendingOrder(db, req.body);
    res.status(created ? 201 : 200).json(orderResponse(order));
  });
}
