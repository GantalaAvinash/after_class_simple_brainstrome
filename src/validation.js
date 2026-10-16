import { ObjectId } from 'mongodb';
import { requireValue } from './errors.js';

function object(value, label) {
  requireValue(value !== null && typeof value === 'object' && !Array.isArray(value), label + ' must be an object.');
}

function keys(value, allowed) {
  requireValue(Object.keys(value).every((key) => allowed.includes(key)), 'The request contains an unsupported field.');
}

export function recordId(value, label = 'Lesson ID') {
  requireValue(typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value), label + ' must be a 24-character hexadecimal ID.');
  return new ObjectId(value);
}

function text(value, label, max = 100) {
  requireValue(typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max, label + ' must be nonempty text (up to ' + max + ' characters).');
  return value.trim();
}

export function normaliseOrder(body) {
  object(body, 'Order');
  keys(body, ['requestId', 'name', 'phone', 'items']);
  requireValue(typeof body.requestId === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.requestId), 'A valid checkout request ID is required.');
  const name = text(body.name, 'Name');
  const phone = text(body.phone, 'Phone', 30);
  requireValue(/^[A-Za-z]+$/.test(name), 'Name must contain letters A–Z only.');
  requireValue(/^[0-9]+$/.test(phone), 'Phone must contain digits only.');
  requireValue(Array.isArray(body.items) && body.items.length > 0 && body.items.length <= 100, 'Choose between 1 and 100 different lessons.');
  const seen = new Set();
  const items = body.items.map((item) => {
    object(item, 'Order item');
    keys(item, ['lessonId', 'quantity']);
    const lessonId = recordId(item.lessonId);
    requireValue(!seen.has(lessonId.toHexString()), 'Each lesson must appear only once in an order.');
    seen.add(lessonId.toHexString());
    requireValue(Number.isSafeInteger(item.quantity) && item.quantity > 0, 'Quantity must be a positive whole number.');
    return { lessonId, quantity: item.quantity };
  }).sort((a, b) => a.lessonId.toHexString().localeCompare(b.lessonId.toHexString()));
  return { requestId: body.requestId.toLowerCase(), name, phone, items };
}

export function normaliseUpdates(body) {
  object(body, 'Update');
  keys(body, ['updates', 'orderId']);
  requireValue(Array.isArray(body.updates) && body.updates.length > 0 && body.updates.length <= 100, 'Provide between 1 and 100 lesson updates.');
  const seen = new Set();
  const updates = body.updates.map((update) => {
    object(update, 'Lesson update');
    keys(update, ['lessonId', 'changes']);
    const lessonId = recordId(update.lessonId);
    requireValue(!seen.has(lessonId.toHexString()), 'A lesson cannot be updated twice in one request.');
    seen.add(lessonId.toHexString());
    object(update.changes, 'Changes');
    keys(update.changes, ['topic', 'location', 'price', 'space', 'image']);
    requireValue(Object.keys(update.changes).length > 0, 'Provide at least one field to update.');
    const changes = { ...update.changes };
    for (const field of ['topic', 'location']) {
      if (field in changes) changes[field] = text(changes[field], field);
    }
    if ('price' in changes) requireValue(typeof changes.price === 'number' && Number.isFinite(changes.price) && changes.price >= 0, 'Price must be a nonnegative number.');
    if ('space' in changes) requireValue(Number.isSafeInteger(changes.space) && changes.space >= 0, 'Spaces must be a nonnegative whole number.');
    if ('image' in changes) requireValue(typeof changes.image === 'string' && /^\/images\/[a-z0-9-]+\.(svg|png|jpe?g|webp)$/.test(changes.image), 'Image must be a local lesson image path.');
    return { lessonId, changes };
  });
  const orderId = body.orderId === undefined ? undefined : recordId(body.orderId, 'Order ID');
  return { updates, orderId };
}
