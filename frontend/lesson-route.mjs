const validId = (value) =>
  typeof value === "string" && /^[a-f0-9]{24}$/i.test(value);
export function lessonHash(id) {
  if (!validId(id)) throw new Error("Invalid lesson link.");
  return "#/lessons/" + id.toLowerCase();
}
export function lessonRoute(hash) {
  if (!hash.startsWith("#/lessons")) return { view: "catalogue", id: null };
  const id = hash.slice("#/lessons/".length);
  return validId(id) && hash === "#/lessons/" + id
    ? { view: "detail", id: id.toLowerCase() }
    : { view: "detail", id: null };
}
export function createLessonLoader(api) {
  let version = 0,
    controller;
  return {
    cancel() {
      version++;
      controller?.abort();
    },
    async load(id) {
      if (!validId(id)) throw new Error("This lesson link is invalid.");
      const current = ++version;
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal;
      try {
        const result = await api("/lessons/" + id, { signal });
        if (current !== version) return null;
        if (result?.lesson?._id !== id || !Array.isArray(result.teachers))
          throw new Error("Lesson details could not be verified.");
        return result;
      } catch (error) {
        if (signal.aborted || current !== version) return null;
        throw error;
      }
    },
  };
}
