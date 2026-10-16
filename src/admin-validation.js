import { requireValue } from "./errors.js";
import { normaliseUpdates, recordId } from "./validation.js";

export const lessonImages = [
  "maths",
  "writing",
  "coding",
  "drama",
  "science",
  "chess",
  "art",
  "guitar",
  "football",
  "ballet",
  "french",
  "robotics",
].map((name) => "/images/" + name + ".svg");
const fields = ["topic", "location", "price", "space", "image"];

export function normaliseAdminInput(action, id, body) {
  requireValue(
    body && typeof body === "object" && !Array.isArray(body),
    "Provide a lesson management request.",
  );
  requireValue(
    Object.keys(body).every((key) =>
      ["requestId", "revision", "lesson", "teacherIds"].includes(key),
    ),
    "The request contains an unsupported field.",
  );
  requireValue(
    typeof body.requestId === "string" &&
      /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
        body.requestId,
      ),
    "A valid management request ID is required.",
  );
  const input = { requestId: body.requestId.toLowerCase() };
  if (action !== "create") {
    input.lessonId = recordId(id);
    requireValue(
      Number.isSafeInteger(body.revision) && body.revision >= 0,
      "The lesson revision is required. Refresh lessons and try again.",
    );
    input.revision = body.revision;
  }
  if (["create", "update"].includes(action)) {
    requireValue(
      body.lesson && fields.every((key) => key in body.lesson),
      "Provide subject, location, price, spaces and image.",
    );
    input.lesson = normaliseUpdates({
      updates: [{ lessonId: "000000000000000000000000", changes: body.lesson }],
    }).updates[0].changes;
    requireValue(
      lessonImages.includes(input.lesson.image),
      "Choose one of the available lesson images.",
    );
    requireValue(
      Number.isSafeInteger(Math.round(input.lesson.price * 100)) &&
        Math.abs(
          input.lesson.price * 100 - Math.round(input.lesson.price * 100),
        ) < 0.00001,
      "Price must have at most two decimal places.",
    );
    requireValue(
      Array.isArray(body.teacherIds) && body.teacherIds.length <= 20,
      "Provide a list of up to 20 teacher IDs.",
    );
    input.teacherIds = body.teacherIds
      .map((value) => recordId(value, "Teacher ID"))
      .sort((a, b) => a.toHexString().localeCompare(b.toHexString()));
    requireValue(
      new Set(input.teacherIds.map(String)).size === input.teacherIds.length,
      "Choose each teacher only once.",
    );
  } else {
    requireValue(
      body.lesson === undefined && body.teacherIds === undefined,
      "Delete and restore requests must not change lesson details.",
    );
  }
  return input;
}
