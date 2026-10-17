import { readFile } from "node:fs/promises";
import { readConfig } from "../src/config.js";
import { connectDatabase } from "../src/database.js";
import { backfillSeedDetails } from "../src/seed-details.js";
const { db, client } = await connectDatabase(readConfig());
try {
  const seed = JSON.parse(
    await readFile(new URL("../data/seed.json", import.meta.url), "utf8"),
  );
  console.info(
    "Filled missing descriptive fields on " +
      (await backfillSeedDetails(db, client, seed)) +
      " existing seed records. Existing content, stock, assignments and orders were preserved.",
  );
} finally {
  await client.close();
}
