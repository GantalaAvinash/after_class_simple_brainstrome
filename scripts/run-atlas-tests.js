import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const uri = process.env.MONGODB_TEST_URI?.trim();
const database = process.env.MONGODB_TEST_DATABASE?.trim() || "afterclass_test";
if (!uri || !/^mongodb(?:\+srv)?:\/\//.test(uri)) {
  console.error(
    "Atlas tests not run: set MONGODB_TEST_URI privately in backend/.env.",
  );
  process.exit(2);
}
if (
  !/^[A-Za-z0-9_-]+_test$/.test(database) ||
  database === (process.env.DATABASE_NAME?.trim() || "afterclass")
) {
  console.error(
    "Atlas tests not run: choose a separate database ending in _test.",
  );
  process.exit(2);
}
// Separate test files share collection/index setup. Run them sequentially so
// their intentional record-level races are isolated from initial setup races.
const result = spawnSync(
  process.execPath,
  [
    "--test",
    "--test-concurrency=1",
    "test/atlas.test.js",
    "test/admin-atlas.test.js",
    "test/teachers-atlas.test.js",
  ],
  {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    env: {
      ...process.env,
      MONGODB_TEST_URI: uri,
      MONGODB_TEST_DATABASE: database,
    },
    stdio: "inherit",
  },
);
if (result.error) console.error("The Atlas test process could not start.");
process.exit(result.status ?? 1);
