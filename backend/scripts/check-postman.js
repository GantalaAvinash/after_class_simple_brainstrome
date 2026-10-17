// Execute the exported Postman scripts, retaining only non-secret evidence.
import { createRequire } from "node:module";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { createApp } from "../src/app.js";
import { connectDatabase } from "../src/database.js";
import { hashPassword } from "../src/admin-auth.js";

const mode = process.argv[2];
if (!["atlas-test", "hosted-read-only"].includes(mode))
  throw new Error("Choose atlas-test or hosted-read-only.");
const require = createRequire(import.meta.url);
const newman = require(process.env.NEWMAN_MODULE_PATH || "newman");
const runnerVersion = require((process.env.NEWMAN_MODULE_PATH || "newman") + "/package.json").version;
if (runnerVersion !== "6.2.3") throw new Error("Use the verified Newman version 6.2.3.");
const collection = JSON.parse(await readFile(new URL("../postman/AfterClass.postman_collection.json", import.meta.url)));
const setVariable = (key, value) => {
  collection.variable.find((entry) => entry.key === key).value = value;
};
let connection, server;
const lessonIds = [], teacherIds = [];
let username, password, databaseName;
try {
  let baseUrl;
  if (mode === "atlas-test") {
    databaseName = process.env.MONGODB_TEST_DATABASE || "afterclass_test";
    if (!process.env.MONGODB_TEST_URI || !/^[A-Za-z0-9_-]+_test$/.test(databaseName) || databaseName === (process.env.DATABASE_NAME || "afterclass"))
      throw new Error("Use a separate Atlas test URI and database ending in _test.");
    connection = await connectDatabase({ uri: process.env.MONGODB_TEST_URI, databaseName });
    const seed = JSON.parse(await readFile(new URL("../data/seed.json", import.meta.url)));
    const ids = new Map(seed.lessons.map((lesson) => [lesson._id, new ObjectId()]));
    const lessons = seed.lessons.map((lesson) => ({ ...lesson, _id: ids.get(lesson._id) }));
    const teachers = seed.teachers.map((teacher) => ({ ...teacher, _id: new ObjectId(), lessonIds: teacher.lessonIds.map((id) => ids.get(id)) }));
    lessonIds.push(...lessons.map((lesson) => lesson._id));
    teacherIds.push(...teachers.map((teacher) => teacher._id));
    await connection.db.collection("lesson").insertMany(lessons);
    await connection.db.collection("teacher").insertMany(teachers);
    setVariable("lessonId", lessons[0]._id.toHexString());
    setVariable("teacherId", teachers[0]._id.toHexString());
    // An ephemeral test administrator avoids using production credentials.
    username = "postman_" + randomBytes(8).toString("hex");
    password = randomBytes(24).toString("base64url");
    const app = createApp({ ...connection, allowedOrigins: [], logger: () => {}, admin: { username, passwordHash: await hashPassword(password) } });
    server = await new Promise((resolve, reject) => {
      const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
      instance.on("error", reject);
    });
    baseUrl = "http://127.0.0.1:" + server.address().port;
  } else {
    const links = JSON.parse(await readFile(new URL("../../submission-links.json", import.meta.url)));
    const url = new URL(links.lessonsUrl);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".onrender.com") || url.username || url.password)
      throw new Error("A real HTTPS Render URL is required.");
    baseUrl = url.origin;
    for (const group of collection.item)
      group.item = group.item.filter((item) => item.request.method === "GET" && (!item.request.url.includes("/admin/") || item.name.startsWith("Anonymous")));
  }
  const expectedRequests = collection.item.reduce((sum, group) => sum + group.item.length, 0);
  const summary = await new Promise((resolve, reject) => {
    const run = newman.run({ collection, environment: { values: [
      { key: "baseUrl", value: baseUrl },
      { key: "adminUsername", value: username || "" },
      { key: "adminPassword", value: password || "" },
    ] }, reporters: [], timeoutRequest: 90000, timeoutScript: 10000 }, (error, result) => error ? reject(new Error("Postman runner could not complete.")) : resolve(result));
    run.on("request", (_error, args) => {
      // Track only records created by this run, even if a later assertion fails.
      if (mode !== "atlas-test" || !args.response || args.response.code !== 201) return;
      const data = args.response.json();
      if (args.item.name === "Create test lesson" && ObjectId.isValid(data.lesson?._id)) lessonIds.push(new ObjectId(data.lesson._id));
      if (args.item.name === "Create and assign a teacher" && ObjectId.isValid(data.teacher?._id)) teacherIds.push(new ObjectId(data.teacher._id));
    });
  });
  const evidence = {
    executedAt: new Date().toISOString(), runner: "Newman 6.2.3 (official Postman collection runner)",
    mode, target: mode === "atlas-test" ? "Production Express application on loopback, real separate MongoDB Atlas test database" : baseUrl,
    ...(databaseName ? { database: databaseName } : {}),
    collectionSchema: collection.info.schema, expectedRequests,
    requests: summary.run.stats.requests, assertions: summary.run.stats.assertions,
    failures: summary.run.failures.map((failure) => ({ name: failure.error?.name, test: failure.error?.test, request: failure.source?.name,
      ...(failure.error?.name === "SyntaxError" ? { scriptError: failure.error.message } : {}),
    })),
    executions: summary.run.executions.map((execution) => ({
      name: execution.item.name, method: execution.request.method,
      path: "/" + execution.request.url.path.join("/"), status: execution.response?.code,
      assertions: (execution.assertions || []).map((assertion) => ({ name: assertion.assertion, passed: !assertion.error && !assertion.skipped })),
    })),
    privacy: "Allowlisted summary only; no credentials, tokens, request/response bodies or raw Newman reports saved.",
  };
  const output = new URL("../../verification/", import.meta.url);
  await mkdir(output, { recursive: true });
  await writeFile(new URL("postman-" + mode + "-" + evidence.executedAt.slice(0, 10) + ".json", output), JSON.stringify(evidence, null, 2) + "\n");
  console.info(JSON.stringify({ mode, requests: evidence.requests, assertions: evidence.assertions, failures: evidence.failures }));
  if (evidence.requests.total !== expectedRequests || evidence.failures.length || evidence.requests.failed || evidence.assertions.failed) process.exitCode = 1;
} finally {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  if (connection) {
    try {
      const { db } = connection;
      await db.collection("order").deleteMany({ "items.lessonId": { $in: lessonIds } });
      if (username) {
        await db.collection("adminAudit").deleteMany({ username });
        await db.collection("adminSession").deleteMany({ username });
      }
      await db.collection("lesson").deleteMany({ _id: { $in: lessonIds } });
      await db.collection("teacher").deleteMany({ _id: { $in: teacherIds } });
      console.info("Removed only this Postman run's isolated fixtures. Assessment data was untouched.");
    } finally { await connection.client.close(); }
  }
}
