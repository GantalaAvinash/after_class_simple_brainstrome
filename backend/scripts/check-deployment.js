import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

try {
  const links = JSON.parse(
    await readFile(
      new URL("../../submission-links.json", import.meta.url),
      "utf8",
    ),
  );
  const frontend = new URL(links.frontendUrl);
  const lessonsUrl = new URL(links.lessonsUrl);
  for (const url of [frontend, lessonsUrl]) {
    assert.equal(url.protocol, "https:", "Hosted addresses must use HTTPS.");
    assert.ok(
      !url.username && !url.password && !url.search && !url.hash,
      "Use public hosted addresses without credentials, queries or fragments.",
    );
  }
  assert.ok(
    frontend.hostname.endsWith(".github.io"),
    "Use the actual GitHub Pages address.",
  );
  assert.ok(
    lessonsUrl.hostname.endsWith(".onrender.com") &&
      lessonsUrl.pathname === "/lessons",
    "Use the actual Render /lessons address.",
  );
  assert.ok(
    links.studentNumber?.trim() &&
      lessonsUrl.hostname
        .toLowerCase()
        .includes(links.studentNumber.trim().toLowerCase()),
    "The Render hostname must include your actual student number.",
  );
  if (!frontend.pathname.endsWith("/")) frontend.pathname += "/";
  const api = lessonsUrl.origin;
  async function get(url, label, options = {}) {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(90000),
    });
    assert.equal(response.status, 200, label + " must respond successfully.");
    return response;
  }
  const [health, catalogue, teachersResponse] = await Promise.all([
    get(api + "/health", "Database health"),
    get(lessonsUrl, "Catalogue/CORS", { headers: { Origin: frontend.origin } }),
    get(api + "/teachers", "Teachers"),
  ]);
  await health.json();
  assert.equal(
    catalogue.headers.get("access-control-allow-origin"),
    frontend.origin,
    "Render must allow the GitHub Pages origin.",
  );
  const lessons = await catalogue.json(),
    teachers = await teachersResponse.json();
  assert.ok(
    Array.isArray(lessons) && lessons.length >= 12,
    "The hosted catalogue needs the twelve seeded lessons.",
  );
  assert.ok(
    Array.isArray(teachers) && teachers.length >= 4,
    "The hosted teaching team needs the four seed profiles.",
  );
  for (const lesson of lessons) {
    assert.ok(
      /^[a-f0-9]{24}$/i.test(lesson._id) &&
        typeof lesson.price === "number" &&
        Number.isFinite(lesson.price) &&
        lesson.price >= 0 &&
        Number.isSafeInteger(lesson.space) &&
        lesson.space >= 0,
      "Hosted lesson IDs, prices and spaces must have valid types.",
    );
  }
  const sample = lessons[0];
  const detail = await (
    await get(api + "/lessons/" + sample._id, "Lesson detail")
  ).json();
  assert.equal(
    detail.lesson._id,
    sample._id,
    "Detail must match the requested lesson.",
  );
  assert.ok(
    Array.isArray(detail.teachers),
    "Detail must return teaching profiles.",
  );
  const enrolment = await (
    await get(api + "/enrolment/" + sample._id, "Enrolment")
  ).json();
  assert.ok(
    Number.isSafeInteger(enrolment.enrolment) && enrolment.enrolment >= 0,
    "Enrolment must be a purchased quantity.",
  );
  const image = await get(api + sample.image, "Lesson image");
  assert.ok(
    image.headers.get("content-type")?.includes("image/svg+xml"),
    "Lesson image must be served as SVG.",
  );
  const missing = await fetch(
    api + "/images/not-present-deployment-check.svg",
    { signal: AbortSignal.timeout(90000) },
  );
  assert.equal(missing.status, 404, "Missing images must fail explicitly.");
  for (const path of ["/admin/lessons", "/admin/teachers"]) {
    const response = await fetch(api + path, {
      signal: AbortSignal.timeout(90000),
    });
    assert.equal(
      response.status,
      401,
      "Administration must reject anonymous access.",
    );
  }
  const html = await (await get(frontend, "GitHub Pages app")).text();
  assert.ok(
    html.includes("AfterClass") && html.includes("./app.js"),
    "Pages must serve AfterClass.",
  );
  const config = await (
    await get(new URL("config.js", frontend), "Frontend API configuration")
  ).text();
  const configuredApi = config.match(
    /apiBaseUrl["']?\s*:\s*(["'])(.*?)\1/,
  )?.[2];
  assert.equal(
    configuredApi,
    api,
    "Hosted frontend must use the actual Render origin.",
  );
  assert.ok(
    !/testPreview["']?\s*:\s*true/.test(config),
    "Fixture mode must be disabled on Pages.",
  );
  for (const path of [
    "admin.html",
    "app.js",
    "admin-app.js",
    "lesson-route.mjs",
    "lesson-detail.css",
    "vendor/vue.esm-browser.prod.js",
  ]) {
    await get(new URL(path, frontend), "Pages asset " + path);
  }
  console.info(
    "Hosted read-only checks passed: Pages assets, Render health/catalogue/details/teachers/enrolment/images, CORS and protected admin routes.",
  );
  console.info(
    "Complete browser checkout, admin sign-in and restart-persistence checks separately. No orders or stock were changed by this command.",
  );
} catch (error) {
  console.error(
    error.code === "ENOENT"
      ? "Hosted checks not run: create submission-links.json with the actual deployed addresses."
      : "Hosted checks failed: " +
          (error instanceof assert.AssertionError
            ? error.message
            : "Check the public addresses, network and service availability."),
  );
  process.exitCode = 1;
}
