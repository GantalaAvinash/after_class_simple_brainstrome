export const SAVED_KEY = "afterclass.saved.v1";
const validId = (id) => typeof id === "string" && /^[a-f0-9]{24}$/i.test(id);
export function restoreSaved(storage) {
  try {
    const ids = JSON.parse(storage.getItem(SAVED_KEY) || "[]");
    return Array.isArray(ids)
      ? [...new Set(ids.filter(validId))].slice(0, 500)
      : [];
  } catch {
    return [];
  }
}
export function category(topic) {
  if (/math|cod|science|robot|chess/i.test(topic)) return "STEM & strategy";
  if (/art|writ|drama|guitar/i.test(topic)) return "Arts & expression";
  if (/football|ballet|sport|dance/i.test(topic)) return "Move & play";
  if (/french|language|spanish|german|mandarin/i.test(topic))
    return "Language & discovery";
  return "More to discover";
}
export function discoveryFilter(
  lessons,
  {
    selectedCategory = "",
    savedOnly = false,
    savedIds = [],
    availableOnly = false,
  } = {},
) {
  return lessons.filter(
    (lesson) =>
      (!selectedCategory || category(lesson.topic) === selectedCategory) &&
      (!savedOnly || savedIds.includes(lesson._id)) &&
      (!availableOnly || lesson.available > 0),
  );
}
export function artTone(id) {
  return "tone-" + (parseInt(id.slice(-2), 16) % 4);
}
