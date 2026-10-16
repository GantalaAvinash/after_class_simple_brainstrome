export const ADMIN_ATTEMPT_KEY = "afterclass.admin.attempt.v1";

export function emptyLesson() {
  return {
    topic: "",
    location: "",
    price: "",
    space: 5,
    image: "/images/art.svg",
    teacherIds: [],
  };
}

export function lessonErrors(draft) {
  const errors = {};
  for (const key of ["topic", "location"])
    if (
      typeof draft[key] !== "string" ||
      !draft[key].trim() ||
      draft[key].trim().length > 100
    )
      errors[key] =
        "Enter " +
        (key === "topic" ? "a subject" : "a location") +
        " (up to 100 characters).";
  const price = Number(draft.price);
  if (
    draft.price === "" ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isSafeInteger(Math.round(price * 100)) ||
    Math.abs(price * 100 - Math.round(price * 100)) > 0.00001
  )
    errors.price =
      "Enter a nonnegative GBP price with up to two decimal places.";
  if (
    draft.space === "" ||
    !Number.isSafeInteger(Number(draft.space)) ||
    Number(draft.space) < 0
  )
    errors.space = "Enter a nonnegative whole number of spaces.";
  if (!/^\/images\/[a-z0-9-]+\.svg$/.test(draft.image))
    errors.image = "Choose a lesson illustration.";
  return errors;
}

export function mutationAttempt(
  action,
  lesson,
  draft,
  requestId = crypto.randomUUID(),
) {
  const body = { requestId };
  const id = lesson?._id;
  if (action !== "create") body.revision = lesson.revision || 0;
  if (["create", "update"].includes(action)) {
    if (Object.keys(lessonErrors(draft)).length)
      throw new Error("Check the highlighted lesson details.");
    body.lesson = {
      topic: draft.topic.trim(),
      location: draft.location.trim(),
      price: Number(draft.price),
      space: Number(draft.space),
      image: draft.image,
    };
    body.teacherIds = [...draft.teacherIds];
  }
  return {
    action,
    method:
      action === "update" ? "PUT" : action === "delete" ? "DELETE" : "POST",
    path:
      "/admin/lessons" +
      (id ? "/" + id : "") +
      (action === "restore" ? "/restore" : ""),
    body,
  };
}

export function restoreAdminAttempt(storage) {
  try {
    const value = JSON.parse(storage.getItem(ADMIN_ATTEMPT_KEY) || "null");
    if (!value) return null;
    const methods = {
      create: "POST",
      update: "PUT",
      delete: "DELETE",
      restore: "POST",
    };
    if (
      methods[value.action] !== value.method ||
      !/^\/admin\/lessons(?:\/[a-f0-9]{24}(?:\/restore)?)?$/.test(value.path) ||
      !/^[a-f0-9-]{36}$/.test(value.body?.requestId)
    )
      throw new Error();
    return value;
  } catch {
    try {
      storage.removeItem(ADMIN_ATTEMPT_KEY);
    } catch {
      /* No usable storage. */
    }
    return null;
  }
}

export function createAdminClient(api, onExpired = () => {}) {
  let token = "";
  return {
    async login(username, password) {
      const session = await api("/admin/session", {
        method: "POST",
        body: { username, password },
      });
      if (
        !/^[a-f0-9]{64}$/.test(session.token) ||
        !Number.isFinite(Date.parse(session.expiresAt))
      )
        throw new Error("Sign-in response could not be verified.");
      token = session.token;
      return { username: session.username, expiresAt: session.expiresAt };
    },
    clear() {
      token = "";
    },
    async request(path, options = {}) {
      if (!token) throw new Error("Sign in to manage lessons.");
      try {
        return await api(path, { ...options, token });
      } catch (error) {
        if (error.status === 401) {
          token = "";
          onExpired();
        }
        throw error;
      }
    },
  };
}

export function saveAdminAttempt(storage, attempt) {
  try {
    storage.setItem(ADMIN_ATTEMPT_KEY, JSON.stringify(attempt));
  } catch {
    throw new Error(
      "Allow session storage to safely save and retry lesson changes.",
    );
  }
}

export async function submitAdminAttempt(client, attempt) {
  const result = await client.request(attempt.path, {
    method: attempt.method,
    body: attempt.body,
  });
  const expectedId = attempt.path.split("/")[3];
  if (
    !result?.lesson ||
    !/^[a-f0-9]{24}$/i.test(result.lesson._id) ||
    (expectedId && result.lesson._id !== expectedId) ||
    result.lesson.revision !== (attempt.body.revision || 0) + 1 ||
    result.lesson.deleted !== (attempt.action === "delete")
  ) {
    throw new Error(
      "The lesson change could not be verified. Retry the saved request to check its status.",
    );
  }
  return result;
}
