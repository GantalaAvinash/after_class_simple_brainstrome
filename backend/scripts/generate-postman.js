import { mkdir, writeFile } from "node:fs/promises";

const status = (code) => [
  'pm.test("Expected HTTP status", () => pm.response.to.have.status(' +
    code +
    "));",
];
const array = [
  ...status(200),
  'pm.test("Returns an array", () => pm.expect(pm.response.json()).to.be.an("array"));',
];
function request(name, method, path, body, tests = status(200), before = []) {
  return {
    name,
    request: {
      method,
      header:
        body === undefined
          ? []
          : [{ key: "Content-Type", value: "application/json" }],
      url: "{{baseUrl}}" + path,
      ...(body === undefined
        ? {}
        : {
            body: {
              mode: "raw",
              raw:
                typeof body === "string" ? body : JSON.stringify(body, null, 2),
              options: { raw: { language: "json" } },
            },
          }),
    },
    event: [
      ...(before.length
        ? [
            {
              listen: "prerequest",
              script: { type: "text/javascript", exec: before },
            },
          ]
        : []),
      { listen: "test", script: { type: "text/javascript", exec: tests } },
    ],
  };
}
const order = {
  requestId: "{{requestId}}",
  name: "Ava",
  phone: "007123456",
  items: [{ lessonId: "{{lessonId}}", quantity: 1 }],
};
const protectedRequest = (...args) => {
  const item = request(...args);
  item.request.header.push({
    key: "Authorization",
    value: "Bearer {{adminToken}}",
  });
  return item;
};
const management = {
  requestId: "{{adminRequestId}}",
  lesson: {
    topic: "Postman test club",
    location: "Hendon",
    price: 9.5,
    space: 5,
    image: "/images/art.svg",
  },
  teacherIds: ["{{teacherId}}"],
};
const freshAdminId = [
  'pm.collectionVariables.set("adminRequestId", pm.variables.replaceIn("{{$guid}}"));',
];
const savedLesson = (code = 200) => [
  ...status(code),
  "const lesson = pm.response.json().lesson;",
  'pm.collectionVariables.set("adminLessonId", lesson._id);',
  'pm.collectionVariables.set("adminRevision", lesson.revision);',
];
const savedTeacher = (code = 200) => [
  ...status(code),
  "const teacher = pm.response.json().teacher;",
  'pm.collectionVariables.set("managedTeacherId", teacher._id);',
  'pm.collectionVariables.set("teacherRevision", teacher.revision);',
];
const collection = {
  info: {
    name: "AfterClass CST3144",
    description:
      "Import into Postman. Set baseUrl to the real service. Practise mutations against test data. Run New order before Confirm order. For administration, set adminUsername/adminPassword as private local environment variables, then run Admin sign-in. Never export populated passwords/tokens. The administration folder creates a new test lesson, edits it, deletes/restores it and signs out.",
    schema:
      "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:3000" },
    { key: "lessonId", value: "100000000000000000000001" },
    { key: "teacherId", value: "200000000000000000000001" },
    { key: "requestId", value: "" },
    { key: "orderId", value: "" },
    { key: "orderUpdates", value: "[]" },
    { key: "adminToken", value: "" },
    { key: "adminLessonId", value: "" },
    { key: "adminRevision", value: "0" },
    { key: "adminRequestId", value: "" },
    { key: "managedTeacherId", value: "" },
    { key: "teacherRevision", value: "0" },
  ],
  item: [
    {
      name: "Core API and checkout",
      item: [
        request("Health", "GET", "/health"),
        request(
          "Lesson detail and teaching team",
          "GET",
          "/lessons/{{lessonId}}",
          undefined,
          [
            ...status(200),
            'pm.test("Detail includes lesson and teachers", () => { const data = pm.response.json(); pm.expect(data.lesson._id).to.equal(pm.collectionVariables.get("lessonId")); pm.expect(data.teachers).to.be.an("array"); });',
          ],
        ),
        request("All lessons", "GET", "/lessons", undefined, [
          ...array,
          'pm.test("At least ten lessons", () => pm.expect(pm.response.json().length).to.be.at.least(10));',
        ]),
        request(
          "New order — saves pending order",
          "POST",
          "/orders",
          order,
          [
            ...status(201),
            "const data = pm.response.json();",
            'pm.collectionVariables.set("orderId", data.orderId);',
            'pm.collectionVariables.set("orderUpdates", JSON.stringify(data.updates));',
            'pm.test("Pending order", () => pm.expect(data.status).to.equal("pending"));',
          ],
          [
            'pm.collectionVariables.set("requestId", pm.variables.replaceIn("{{$guid}}"));',
          ],
        ),
        request(
          "Confirm order — absolute space PUT",
          "PUT",
          "/lessons",
          '{"orderId":"{{orderId}}","updates":{{orderUpdates}}}',
          [
            ...status(200),
            'pm.test("Confirmed order", () => pm.expect(pm.response.json().status).to.equal("confirmed"));',
          ],
        ),
        request(
          "Replay the same POST — no duplicate order",
          "POST",
          "/orders",
          order,
          [
            ...status(200),
            'pm.test("Same order ID", () => pm.expect(pm.response.json().orderId).to.equal(pm.collectionVariables.get("orderId")));',
          ],
        ),
      ],
    },
    {
      name: "Challenges",
      item: [
        request(
          "Search all four fields — numeric example",
          "GET",
          "/lessons?q=9",
          undefined,
          array,
        ),
        request(
          "Case-insensitive location search",
          "GET",
          "/lessons?q=HENDON",
          undefined,
          array,
        ),
        request("Teachers", "GET", "/teachers", undefined, array),
        request(
          "Lessons taught by Mina Patel",
          "GET",
          "/lessons?teacherId={{teacherId}}",
          undefined,
          array,
        ),
        request(
          "Combined teacher and search",
          "GET",
          "/lessons?teacherId={{teacherId}}&q=math",
          undefined,
          array,
        ),
        request(
          "Enrolment — confirmed purchased quantities",
          "GET",
          "/enrolment/{{lessonId}}",
          undefined,
          [
            ...status(200),
            'pm.test("Nonnegative enrolment", () => pm.expect(pm.response.json().enrolment).to.be.at.least(0));',
          ],
        ),
      ],
    },
    {
      name: "Protected administration — use private environment credentials",
      item: [
        request(
          "Admin sign-in",
          "POST",
          "/admin/session",
          { username: "{{adminUsername}}", password: "{{adminPassword}}" },
          [
            ...status(201),
            'pm.collectionVariables.set("adminToken", pm.response.json().token);',
          ],
        ),
        protectedRequest("Verify session", "GET", "/admin/session"),
        protectedRequest("Manage catalogue", "GET", "/admin/lessons"),
        protectedRequest("Booking overview", "GET", "/admin/overview"),
        protectedRequest(
          "Create test lesson",
          "POST",
          "/admin/lessons",
          management,
          savedLesson(201),
          freshAdminId,
        ),
        protectedRequest(
          "Replay create — same lesson",
          "POST",
          "/admin/lessons",
          management,
          [
            ...status(201),
            'pm.test("Same ID on replay", () => pm.expect(pm.response.json().lesson._id).to.equal(pm.collectionVariables.get("adminLessonId")));',
          ],
        ),
        protectedRequest(
          "Edit test lesson — absolute price and spaces",
          "PUT",
          "/admin/lessons/{{adminLessonId}}",
          '{"requestId":"{{adminRequestId}}","revision":{{adminRevision}},"lesson":{"topic":"Postman test club","location":"Hendon","price":19,"space":2,"image":"/images/art.svg"},"teacherIds":["{{teacherId}}"]}',
          savedLesson(),
          freshAdminId,
        ),
        protectedRequest(
          "Delete test lesson — preserve history",
          "DELETE",
          "/admin/lessons/{{adminLessonId}}",
          '{"requestId":"{{adminRequestId}}","revision":{{adminRevision}}}',
          savedLesson(),
          freshAdminId,
        ),
        protectedRequest(
          "Restore test lesson",
          "POST",
          "/admin/lessons/{{adminLessonId}}/restore",
          '{"requestId":"{{adminRequestId}}","revision":{{adminRevision}}}',
          savedLesson(),
          freshAdminId,
        ),
        protectedRequest(
          "Set absolute spaces to 5 and price to 9",
          "PUT",
          "/lessons",
          {
            updates: [
              { lessonId: "{{lessonId}}", changes: { space: 5, price: 9 } },
            ],
          },
        ),
        protectedRequest(
          "Forbidden field update",
          "PUT",
          "/lessons",
          {
            updates: [
              { lessonId: "{{lessonId}}", changes: { _id: "forbidden" } },
            ],
          },
          status(400),
        ),
        protectedRequest(
          "Manage teaching team",
          "GET",
          "/admin/teachers",
          undefined,
          array,
        ),
        protectedRequest(
          "Create and assign a teacher",
          "POST",
          "/admin/teachers",
          {
            requestId: "{{adminRequestId}}",
            teacher: {
              firstName: "Alex",
              lastName: "Morgan",
              specialism: "Creative technology",
              bio: "Fictitious Postman verification profile.",
            },
            lessonIds: ["{{adminLessonId}}"],
          },
          savedTeacher(201),
          freshAdminId,
        ),
        protectedRequest(
          "Replay teacher create",
          "POST",
          "/admin/teachers",
          {
            requestId: "{{adminRequestId}}",
            teacher: {
              firstName: "Alex",
              lastName: "Morgan",
              specialism: "Creative technology",
              bio: "Fictitious Postman verification profile.",
            },
            lessonIds: ["{{adminLessonId}}"],
          },
          [
            ...status(201),
            'pm.test("Same teacher on replay", () => pm.expect(pm.response.json().teacher._id).to.equal(pm.collectionVariables.get("managedTeacherId")));',
          ],
        ),
        protectedRequest(
          "Edit teacher and assignments",
          "PUT",
          "/admin/teachers/{{managedTeacherId}}",
          '{"requestId":"{{adminRequestId}}","revision":{{teacherRevision}},"teacher":{"firstName":"Alex","lastName":"Morgan","specialism":"Creative coding","bio":"Updated fictitious verification profile."},"lessonIds":["{{adminLessonId}}","{{lessonId}}"]}',
          savedTeacher(),
          freshAdminId,
        ),
        protectedRequest(
          "Delete teacher — retain associations for restore",
          "DELETE",
          "/admin/teachers/{{managedTeacherId}}",
          '{"requestId":"{{adminRequestId}}","revision":{{teacherRevision}}}',
          savedTeacher(),
          freshAdminId,
        ),
        protectedRequest(
          "Restore teacher",
          "POST",
          "/admin/teachers/{{managedTeacherId}}/restore",
          '{"requestId":"{{adminRequestId}}","revision":{{teacherRevision}}}',
          savedTeacher(),
          freshAdminId,
        ),
        protectedRequest(
          "Sign out and clear local token",
          "DELETE",
          "/admin/session",
          undefined,
          [...status(200), 'pm.collectionVariables.unset("adminToken");'],
        ),
        request(
          "Anonymous management denied",
          "GET",
          "/admin/lessons",
          undefined,
          status(401),
        ),
        request(
          "Anonymous teacher management denied",
          "GET",
          "/admin/teachers",
          undefined,
          status(401),
        ),
        request(
          "Anonymous general PUT denied",
          "PUT",
          "/lessons",
          { updates: [{ lessonId: "{{lessonId}}", changes: { price: 1 } }] },
          status(401),
        ),
      ],
    },
    {
      name: "Middleware and invalid requests",
      item: [
        request("Existing image", "GET", "/images/maths.svg"),
        request(
          "Missing image",
          "GET",
          "/images/not-present.svg",
          undefined,
          status(404),
        ),
        request(
          "Malformed lesson ID",
          "GET",
          "/enrolment/bad-id",
          undefined,
          status(400),
        ),
        request(
          "Invalid name",
          "POST",
          "/orders",
          { ...order, name: "Ava2" },
          status(400),
        ),
      ],
    },
  ],
};
const output = new URL("../postman/", import.meta.url);
await mkdir(output, { recursive: true });
await writeFile(
  new URL("AfterClass.postman_collection.json", output),
  JSON.stringify(collection, null, 2) + "\n",
);
console.info(
  "Postman collection generated: " +
    collection.item.reduce((sum, group) => sum + group.item.length, 0) +
    " requests, with no credentials.",
);
