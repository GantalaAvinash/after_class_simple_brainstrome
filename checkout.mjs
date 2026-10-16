import { contactErrors } from './state.mjs';

export const STORAGE_KEY = 'afterclass.checkout.v1';
const validId = (id) => typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id);

export function createAttempt(name, phone, items, requestId = crypto.randomUUID()) {
  const errors = contactErrors(name, phone);
  if (errors.name || errors.phone || !items.length) throw new Error('Check your basket and contact details before checkout.');
  return {
    version: 1,
    payload: { requestId, name: name.trim(), phone: phone.trim(), items: items.map((item) => ({ lessonId: item._id, quantity: item.quantity })) },
    order: null,
  };
}

export function saveAttempt(storage, attempt) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(attempt)); }
  catch { throw new Error('Your browser could not save this checkout. Allow session storage and try again before submitting.'); }
}

export function restoreAttempt(storage) {
  try {
    const attempt = JSON.parse(storage.getItem(STORAGE_KEY) || 'null');
    if (!attempt) return null;
    const body = attempt.payload;
    const errors = contactErrors(body?.name, body?.phone);
    if (attempt.version !== 1 || errors.name || errors.phone || !/^[a-f0-9-]{36}$/i.test(body.requestId) || !Array.isArray(body.items) || !body.items.length ||
      !body.items.every((item) => validId(item.lessonId) && Number.isSafeInteger(item.quantity) && item.quantity > 0) ||
      new Set(body.items.map((item) => item.lessonId)).size !== body.items.length) throw new Error('Invalid stored checkout');
    // Re-fetch by the same requestId after reload; storage is not authoritative
    // for the order's status or the server's proposed stock values.
    attempt.order = null;
    return attempt;
  } catch {
    try { storage.removeItem(STORAGE_KEY); } catch { /* Storage may be blocked. */ }
    return null;
  }
}

export async function submitAttempt(api, attempt, persist) {
  if (!attempt.order) {
    const order = await api('/orders', { method: 'POST', body: attempt.payload });
    if (!validId(order.orderId) || !['pending', 'confirmed'].includes(order.status) || !Array.isArray(order.updates)) {
      throw new Error('The order response could not be verified. Please retry.');
    }
    attempt.order = order;
  }
  persist(attempt);
  if (attempt.order.status === 'confirmed') return attempt.order;
  const result = await api('/lessons', {
    method: 'PUT', body: { orderId: attempt.order.orderId, updates: attempt.order.updates },
  });
  if (result.status !== 'confirmed' || result.orderId !== attempt.order.orderId) {
    throw new Error('Confirmation could not be verified. Please retry to check your order.');
  }
  return result;
}
