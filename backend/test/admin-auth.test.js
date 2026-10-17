import assert from "node:assert/strict";
import { test } from "node:test";
import { createApp } from "../src/app.js";
import { hashPassword, createAdminAuth } from "../src/admin-auth.js";
import { fixtures } from "../support/fixtures.js";
import { testDatabase } from "../support/test-database.js";

const password = "OnlyForAutomatedTests!472";
const admin = {
  username: "operator",
  passwordHash: await hashPassword(password),
};
async function setup(t, credentials = admin) {
  const data = testDatabase(await fixtures());
  const server = createApp({
    ...data,
    admin: credentials,
    allowedOrigins: ["http://localhost:8080"],
    logger: () => {},
  }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const request = async (path, method = "GET", body, token) => {
    const response = await fetch(
      "http://127.0.0.1:" + server.address().port + path,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      },
    );
    return {
      status: response.status,
      data: await response.json().catch(() => null),
      headers: response.headers,
    };
  };
  return { ...data, request };
}

test("admin access fails closed without credentials; public browsing remains available", async (t) => {
  const { request } = await setup(t, {});
  assert.equal(
    (
      await request("/admin/session", "POST", {
        username: "operator",
        password,
      })
    ).status,
    503,
  );
  assert.equal((await request("/lessons")).status, 200);
  assert.equal((await request("/admin/session")).status, 401);
});

test("admin login, hashed session, server expiry and logout are enforced", async (t) => {
  const { request, state } = await setup(t);
  assert.equal(
    (
      await request("/admin/session", "POST", {
        username: "operator",
        password: "wrong",
      })
    ).status,
    401,
  );
  const login = await request("/admin/session", "POST", {
    username: "operator",
    password,
  });
  assert.equal(login.status, 201);
  assert.equal(login.headers.get("cache-control"), "no-store");
  assert.equal(login.data.token.length, 64);
  assert.ok(!JSON.stringify(state.adminSession).includes(login.data.token));
  assert.equal(
    (await request("/admin/session", "GET", undefined, login.data.token))
      .status,
    200,
  );
  state.adminSession[0].expiresAt = new Date(0);
  assert.equal(
    (await request("/admin/session", "GET", undefined, login.data.token))
      .status,
    401,
  );
  const next = await request("/admin/session", "POST", {
    username: "operator",
    password,
  });
  assert.equal(
    (await request("/admin/session", "DELETE", undefined, next.data.token))
      .status,
    200,
  );
  assert.equal(
    (await request("/admin/session", "GET", undefined, next.data.token)).status,
    401,
  );
});

test("all unbound lesson updates require admin authorisation; CORS supports bearer headers", async (t) => {
  const { request } = await setup(t);
  const body = {
    updates: [
      { lessonId: "100000000000000000000001", changes: { space: 100 } },
    ],
  };
  assert.equal((await request("/lessons", "PUT", body)).status, 401);
  const login = await request("/admin/session", "POST", {
    username: "operator",
    password,
  });
  assert.equal(
    (await request("/lessons", "PUT", body, login.data.token)).status,
    200,
  );
  const preflight = await request("/lessons", "OPTIONS");
  assert.match(
    preflight.headers.get("access-control-allow-headers"),
    /Authorization/,
  );
  assert.match(preflight.headers.get("access-control-allow-methods"), /DELETE/);
});

test("every management endpoint rejects anonymous requests and authenticated CRUD works over HTTP", async (t) => {
  const { request } = await setup(t);
  for (const [path, method] of [
    ["/admin/lessons", "GET"],
    ["/admin/overview", "GET"],
    ["/admin/lessons", "POST"],
    ["/admin/lessons/100000000000000000000001", "PUT"],
    ["/admin/lessons/100000000000000000000001", "DELETE"],
    ["/admin/lessons/100000000000000000000001/restore", "POST"],
  ]) {
    assert.equal(
      (await request(path, method, method === "GET" ? undefined : {})).status,
      401,
    );
  }
  const {
    data: { token },
  } = await request("/admin/session", "POST", {
    username: "operator",
    password,
  });
  const body = {
    requestId: crypto.randomUUID(),
    lesson: {
      topic: "New club",
      location: "Hendon",
      price: 19,
      space: 5,
      image: "/images/art.svg",
    },
    teacherIds: [],
  };
  const created = await request("/admin/lessons", "POST", body, token);
  assert.equal(created.status, 201);
  const id = created.data.lesson._id;
  assert.equal(
    (
      await request(
        "/admin/lessons/" + id,
        "PUT",
        { ...body, requestId: crypto.randomUUID(), revision: 1 },
        token,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await request(
        "/admin/lessons/" + id,
        "DELETE",
        { requestId: crypto.randomUUID(), revision: 2 },
        token,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await request(
        "/admin/lessons/" + id + "/restore",
        "POST",
        { requestId: crypto.randomUUID(), revision: 3 },
        token,
      )
    ).status,
    200,
  );
  assert.equal(
    (await request("/admin/overview", "GET", undefined, token)).data.stats
      .activeLessons,
    13,
  );
});

test("login throttling includes invalid usernames and is shared through the database", async (t) => {
  const { request } = await setup(t);
  for (let i = 0; i < 10; i++)
    assert.equal(
      (
        await request("/admin/session", "POST", {
          username: "unknown",
          password: "bad",
        })
      ).status,
      401,
    );
  const blocked = await request("/admin/session", "POST", {
    username: "operator",
    password,
  });
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get("retry-after")) > 0);
});

test("teacher management is protected and its assignment appears on public lesson details", async (t) => {
  const { request } = await setup(t);
  for (const [path, method] of [
    ["/admin/teachers", "GET"],
    ["/admin/teachers", "POST"],
    ["/admin/teachers/200000000000000000000001", "PUT"],
    ["/admin/teachers/200000000000000000000001", "DELETE"],
    ["/admin/teachers/200000000000000000000001/restore", "POST"],
  ])
    assert.equal(
      (await request(path, method, method === "GET" ? undefined : {})).status,
      401,
    );
  assert.equal((await request("/lessons/bad")).status, 400);
  assert.equal(
    (await request("/lessons/ffffffffffffffffffffffff")).status,
    404,
  );
  const {
    data: { token },
  } = await request("/admin/session", "POST", {
    username: "operator",
    password,
  });
  const body = {
    requestId: crypto.randomUUID(),
    teacher: {
      firstName: "Alex",
      lastName: "Morgan",
      specialism: "Creative technology",
      bio: "Fictitious teacher profile.",
    },
    lessonIds: ["100000000000000000000003"],
  };
  const created = await request("/admin/teachers", "POST", body, token);
  assert.equal(created.status, 201);
  const id = created.data.teacher._id;
  assert.ok(
    (await request("/lessons/100000000000000000000003")).data.teachers.some(
      (t) => t._id === id,
    ),
  );
  assert.equal(
    (
      await request(
        "/admin/teachers/" + id,
        "PUT",
        { ...body, requestId: crypto.randomUUID(), revision: 1, lessonIds: [] },
        token,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await request(
        "/admin/teachers/" + id,
        "DELETE",
        { requestId: crypto.randomUUID(), revision: 2 },
        token,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await request(
        "/admin/teachers/" + id + "/restore",
        "POST",
        { requestId: crypto.randomUUID(), revision: 3 },
        token,
      )
    ).status,
    200,
  );
  assert.equal(
    (await request("/admin/teachers", "GET", undefined, token)).data.length,
    5,
  );
});

test("credential rotation invalidates sessions even before their expiry", async () => {
  const { db, state } = testDatabase();
  const auth = createAdminAuth(db, admin);
  const session = await auth.login({ username: "operator", password });
  assert.equal(state.adminSession.length, 1);
  const rotated = createAdminAuth(db, {
    ...admin,
    passwordHash: await hashPassword("RotatedOnlyForTests!452"),
  });
  await assert.rejects(
    rotated.authenticate("Bearer " + session.token),
    (error) => error.status === 401,
  );
});
