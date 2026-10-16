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
    requireValue(teacher, "Teacher not found.", 404);
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
  app.get("/teachers", async (_req, res) => {
    const teachers = await db.collection("teacher").find({}).toArray();
    res.json(teachers.sort((a, b) => a.lastName.localeCompare(b.lastName)));
  });
}
