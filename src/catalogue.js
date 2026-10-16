import { requireValue } from "./errors.js";
import { recordId } from "./validation.js";

export async function findLessons(db, query = {}) {
  requireValue(
    query.q === undefined ||
      (typeof query.q === "string" && query.q.length <= 100),
    "Search must be text of at most 100 characters.",
  );
  const filter = { deleted: { $ne: true } };
  if (query.teacherId !== undefined) {
    const teacher = await db
      .collection("teacher")
      .findOne({ _id: recordId(query.teacherId, "Teacher ID") });
    requireValue(teacher && teacher.deleted !== true, "Teacher not found.", 404);
    filter._id = { $in: teacher.lessonIds };
  }
  const lessons = await db.collection("lesson").find(filter).toArray();
  const term = (query.q || "").trim().toLocaleLowerCase("en-GB");
  // A small catalogue needs no search library. Matching happens here on the server,
  // including numeric price/space fields, before the response reaches the browser.
  return term
    ? lessons.filter((lesson) =>
        ["topic", "location", "price", "space"].some((field) =>
          String(lesson[field]).toLocaleLowerCase("en-GB").includes(term),
        ),
      )
    : lessons;
}

export function registerCatalogueRoutes(app, db) {
  app.get("/lessons", async (req, res) =>
    res.json(await findLessons(db, req.query)),
  );
  app.get('/lessons/:id', async (req,res) => res.json(await findLessonDetail(db,req.params.id)));
  app.get('/teachers', async (_req,res) => res.json(await listPublicTeachers(db)));
}

export async function listPublicTeachers(db) {
  const teachers = await db.collection('teacher').find({ deleted: { $ne: true } }).toArray();
  return teachers.sort((a,b) => a.lastName.localeCompare(b.lastName));
}

export async function findLessonDetail(db, id) {
  const lesson = await db.collection('lesson').findOne({ _id: recordId(id), deleted: { $ne: true } });
  requireValue(lesson, 'This lesson is no longer available.', 404);
  const teachers = (await listPublicTeachers(db)).filter(teacher => teacher.lessonIds.some(value => value.equals(lesson._id)));
  return { lesson, teachers };
}
