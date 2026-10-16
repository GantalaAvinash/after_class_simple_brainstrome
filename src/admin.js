import { createHash } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { requireValue } from './errors.js';
import { normaliseAdminInput, lessonImages } from './admin-validation.js';
import { transaction } from './updates.js';

export async function listAdminLessons(db, session) {
  const lessons = await db.collection('lesson').find({}, { session }).toArray();
  const teachers = await db.collection('teacher').find({}, { session }).toArray();
  return lessons.map((lesson) => ({ ...lesson, revision: lesson.revision || 0, teacherIds: teachers.filter((teacher) => teacher.lessonIds.some((id) => id.equals(lesson._id))).map((teacher) => teacher._id) }))
    .sort((a, b) => a.topic.localeCompare(b.topic));
}

export async function mutateLesson(db, client, username, action, id, body) {
  const input = normaliseAdminInput(action, id, body);
  const fingerprint = createHash('sha256').update(JSON.stringify({ action, input })).digest('hex');
  return transaction(client, async (session) => {
    const audit = db.collection('adminAudit');
    const existing = await audit.findOne({ _id: input.requestId }, { session });
    if (existing) {
      requireValue(existing.fingerprint === fingerprint && existing.username === username, 'This management request ID was already used with different details.', 409);
      return existing.result;
    }
    const lessons = db.collection('lesson');
    const before = action === 'create' ? null : await lessons.findOne({ _id: input.lessonId }, { session });
    if (action !== 'create') {
      requireValue(before, 'Lesson not found.', 404);
      requireValue((before.revision || 0) === input.revision, 'This lesson changed since you opened it. Refresh lessons before editing.', 409);
      requireValue(action === 'restore' ? before.deleted === true : before.deleted !== true, action === 'restore' ? 'This lesson is already active.' : 'This lesson was deleted. Restore it before editing.', 409);
    }
    const teachers = await db.collection('teacher').find({}, { session }).toArray();
    if (input.teacherIds) for (const teacherId of input.teacherIds) {
      requireValue(teachers.some((teacher) => teacher._id.equals(teacherId)), 'A selected teacher was not found.', 404);
    }
    const now = new Date();
    const lessonId = before?._id || new ObjectId();
    const after = action === 'create'
      ? { _id: lessonId, ...input.lesson, deleted: false, revision: 1, createdAt: now, updatedAt: now }
      : { ...before, ...(input.lesson || {}), deleted: action === 'delete', revision: input.revision + 1, updatedAt: now };
    if (action === 'create') await lessons.insertOne(after, { session });
    else await lessons.updateOne({ _id: lessonId }, { $set: Object.fromEntries(Object.entries(after).filter(([key]) => key !== '_id')) }, { session });
    // Every association change shares the lesson transaction. A deleted lesson
    // retains associations for restoration, but public GET excludes it.
    if (input.teacherIds) for (const teacher of teachers) {
      const ids = teacher.lessonIds.filter((value) => !value.equals(lessonId));
      if (input.teacherIds.some((value) => value.equals(teacher._id))) ids.push(lessonId);
      if (JSON.stringify(ids) !== JSON.stringify(teacher.lessonIds)) {
        await db.collection('teacher').updateOne({ _id: teacher._id }, { $set: { lessonIds: ids } }, { session });
      }
    }
    const teacherIds = input.teacherIds || teachers.filter((teacher) => teacher.lessonIds.some((value) => value.equals(lessonId))).map((teacher) => teacher._id);
    const result = { lesson: { ...after, teacherIds } };
    await audit.insertOne({ _id: input.requestId, username, action, lessonId, occurredAt: now, fingerprint, before, result }, { session });
    return result;
  });
}

export async function adminOverview(db) {
  const lessons = await listAdminLessons(db);
  const orders = await db.collection('order').find({ status: 'confirmed' }, { projection: { items: 1 } }).toArray();
  const purchased = {};
  let revenuePence = 0;
  for (const order of orders) for (const item of order.items) {
    purchased[item.lessonId] = (purchased[item.lessonId] || 0) + item.quantity;
    revenuePence += Math.round(item.unitPrice * 100) * item.quantity;
  }
  const active = lessons.filter((lesson) => lesson.deleted !== true);
  const audit = await db.collection('adminAudit').find({}, { projection: { before: 0, result: 0, fingerprint: 0 } }).toArray();
  return {
    stats: { activeLessons: active.length, availablePlaces: active.reduce((sum, lesson) => sum + lesson.space, 0), confirmedOrders: orders.length, purchasedPlaces: Object.values(purchased).reduce((sum, value) => sum + value, 0), revenuePence },
    lessons: lessons.map((lesson) => ({ lessonId: lesson._id, topic: lesson.topic, deleted: lesson.deleted === true, available: lesson.space, purchased: purchased[lesson._id] || 0 })),
    recentActivity: audit.sort((a, b) => b.occurredAt - a.occurredAt).slice(0, 8).map((entry) => ({ action: entry.action, lessonId: entry.lessonId, username: entry.username, occurredAt: entry.occurredAt })),
  };
}

export function registerAdminRoutes(app, db, client, guard) {
  app.get('/admin/lessons', guard, async (_req, res) => res.json({ lessons: await listAdminLessons(db), images: lessonImages }));
  app.get('/admin/overview', guard, async (_req, res) => res.json(await adminOverview(db)));
  app.post('/admin/lessons', guard, async (req, res) => res.status(201).json(await mutateLesson(db, client, req.admin.username, 'create', null, req.body)));
  app.put('/admin/lessons/:id', guard, async (req, res) => res.json(await mutateLesson(db, client, req.admin.username, 'update', req.params.id, req.body)));
  app.delete('/admin/lessons/:id', guard, async (req, res) => res.json(await mutateLesson(db, client, req.admin.username, 'delete', req.params.id, req.body)));
  app.post('/admin/lessons/:id/restore', guard, async (req, res) => res.json(await mutateLesson(db, client, req.admin.username, 'restore', req.params.id, req.body)));
}
