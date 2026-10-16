import { createHash } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { requireValue } from './errors.js';
import { recordId } from './validation.js';
import { transaction } from './updates.js';

function teacherInput(action, id, body) {
  requireValue(body && typeof body === 'object' && !Array.isArray(body), 'Provide a teacher management request.');
  requireValue(Object.keys(body).every(key => ['requestId','revision','teacher','lessonIds'].includes(key)), 'The request contains an unsupported field.');
  requireValue(typeof body.requestId === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.requestId), 'A valid management request ID is required.');
  const input = { requestId: body.requestId.toLowerCase() };
  if (action !== 'create') {
    input.teacherId = recordId(id, 'Teacher ID');
    requireValue(Number.isSafeInteger(body.revision) && body.revision >= 0, 'The teacher revision is required. Refresh and try again.');
    input.revision = body.revision;
  }
  if (['create','update'].includes(action)) {
    const value = body.teacher;
    requireValue(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).every(key => ['firstName','lastName','specialism','bio'].includes(key)), 'Provide valid teacher profile fields.');
    input.teacher = {};
    for (const key of ['firstName','lastName']) {
      requireValue(typeof value[key] === 'string' && /^[\p{L}\p{M}][\p{L}\p{M}'’ -]{0,59}$/u.test(value[key].trim()), 'Teacher names must contain letters, spaces, apostrophes or hyphens (up to 60 characters).');
      input.teacher[key] = value[key].trim();
    }
    for (const [key, max] of [['specialism',100],['bio',2000]]) {
      requireValue(value[key] === undefined || (typeof value[key] === 'string' && value[key].trim().length <= max), key + ' is too long or invalid.');
      input.teacher[key] = (value[key] || '').trim();
    }
    requireValue(Array.isArray(body.lessonIds) && body.lessonIds.length <= 100, 'Choose up to 100 lessons.');
    input.lessonIds = body.lessonIds.map(value => recordId(value)).sort((a,b) => String(a).localeCompare(String(b)));
    requireValue(new Set(input.lessonIds.map(String)).size === input.lessonIds.length, 'Choose each lesson only once.');
  } else requireValue(body.teacher === undefined && body.lessonIds === undefined, 'Delete and restore must not change profile fields.');
  return input;
}

export async function listAdminTeachers(db) {
  const teachers = await db.collection('teacher').find({}).toArray();
  return teachers.map(teacher => ({ ...teacher, revision: teacher.revision || 0 })).sort((a,b) => a.lastName.localeCompare(b.lastName));
}

export async function mutateTeacher(db, client, username, action, id, body) {
  const input = teacherInput(action, id, body);
  const fingerprint = createHash('sha256').update(JSON.stringify({ action: 'teacher-' + action, input })).digest('hex');
  try { return await transaction(client, async session => {
    const audit = db.collection('adminAudit');
    const existing = await audit.findOne({ _id: input.requestId }, { session });
    if (existing) {
      requireValue(existing.fingerprint === fingerprint && existing.username === username, 'This management request ID was already used with different details.', 409);
      return existing.result;
    }
    const teachers = db.collection('teacher');
    const before = action === 'create' ? null : await teachers.findOne({ _id: input.teacherId }, { session });
    if (action !== 'create') {
      requireValue(before, 'Teacher not found.', 404);
      requireValue((before.revision || 0) === input.revision, 'This teacher or their assignments changed. Refresh before editing.', 409);
      requireValue(action === 'restore' ? before.deleted === true : before.deleted !== true, action === 'restore' ? 'This teacher is already active.' : 'Restore this teacher before editing.', 409);
    }
    const lessonIds = input.lessonIds || before?.lessonIds || [];
    for (const lessonId of lessonIds) requireValue(await db.collection('lesson').findOne({ _id: lessonId }, { session }), 'A selected lesson was not found.', 404);
    const now = new Date();
    const after = { ...(before || { _id: new ObjectId(), createdAt: now }), ...(input.teacher || {}), lessonIds, deleted: action === 'delete', revision: (before?.revision || 0) + 1, updatedAt: now };
    if (action === 'create') await teachers.insertOne(after, { session });
    else await teachers.updateOne({ _id: after._id }, { $set: Object.fromEntries(Object.entries(after).filter(([key]) => key !== '_id')) }, { session });
    // Membership is stored once, on the teacher. Touch affected lesson revisions
    // so a stale lesson editor cannot silently undo a teacher-side assignment.
    const previousIds = before?.deleted ? [] : before?.lessonIds || [];
    const nextIds = after.deleted ? [] : after.lessonIds;
    const affected = new Map([...previousIds, ...nextIds].map(value => [String(value), value]));
    for (const [key, lessonId] of affected) {
      if (previousIds.some(value => String(value) === key) === nextIds.some(value => String(value) === key)) continue;
      await db.collection('lesson').updateOne({ _id: lessonId }, { $inc: { revision: 1 }, $set: { updatedAt: now } }, { session });
    }
    const result = { teacher: after };
    await audit.insertOne({ _id: input.requestId, username, action: 'teacher-' + action, teacherId: after._id, entityLabel: after.firstName + ' ' + after.lastName, occurredAt: now, fingerprint, before, result }, { session });
    return result;
  }); } catch (error) {
    if (error.code !== 11000) throw error;
    const winner = await db.collection('adminAudit').findOne({ _id: input.requestId });
    if (!winner) throw error;
    requireValue(winner.fingerprint === fingerprint && winner.username === username, 'This management request ID was already used with different details.', 409);
    return winner.result;
  }
}

export function registerTeacherAdminRoutes(app, db, client, guard) {
  app.get('/admin/teachers', guard, async (_req,res) => res.json(await listAdminTeachers(db)));
  app.post('/admin/teachers', guard, async (req,res) => res.status(201).json(await mutateTeacher(db,client,req.admin.username,'create',null,req.body)));
  app.put('/admin/teachers/:id', guard, async (req,res) => res.json(await mutateTeacher(db,client,req.admin.username,'update',req.params.id,req.body)));
  app.delete('/admin/teachers/:id', guard, async (req,res) => res.json(await mutateTeacher(db,client,req.admin.username,'delete',req.params.id,req.body)));
  app.post('/admin/teachers/:id/restore', guard, async (req,res) => res.json(await mutateTeacher(db,client,req.admin.username,'restore',req.params.id,req.body)));
}
