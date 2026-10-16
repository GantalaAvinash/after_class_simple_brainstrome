import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const command = (overrides = {}) =>
  spawnSync(
    process.execPath,
    [new URL("../scripts/run-atlas-tests.js", import.meta.url).pathname],
    {
      env: {
        ...process.env,
        MONGODB_TEST_URI: "",
        DATABASE_NAME: "afterclass",
        MONGODB_TEST_DATABASE: "afterclass_test",
        ...overrides,
      },
      encoding: "utf8",
    },
  );

test("explicit Atlas command fails rather than passing with three skipped tests when credentials are absent", () => {
  const result = command();
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Atlas tests not run/);
  assert.ok(!result.stdout.includes("SKIP"));
});

test("Atlas command refuses assessment databases before starting a database connection", () => {
  for (const values of [
    { MONGODB_TEST_DATABASE: "afterclass" },
    {
      MONGODB_TEST_DATABASE: "afterclass_test",
      DATABASE_NAME: "afterclass_test",
    },
  ]) {
    const result = command({
      MONGODB_TEST_URI: "mongodb://127.0.0.1:1",
      ...values,
    });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /separate database ending in _test/);
    assert.ok(!result.stderr.includes("127.0.0.1"));
  }
});
