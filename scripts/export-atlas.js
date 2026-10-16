import { mkdir, writeFile, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { readConfig } from '../src/config.js';
import { connectDatabase } from '../src/database.js';
import { serialiseCollection, exportFilename } from '../src/export-data.js';
import { assessmentCollections, operationalCollections } from '../src/export-policy.js';

const config = readConfig();
const { client, db } = await connectDatabase(config);
const session = client.startSession();
try {
  const collections = assessmentCollections(await db.listCollections({}, { nameOnly: true }).toArray()).sort((a, b) => a.name.localeCompare(b.name));
  for (const required of ['lesson', 'order', 'teacher']) {
    if (!collections.some((collection) => collection.name === required)) throw new Error('Seed the assessment database before export: missing ' + required + '.');
  }
  const snapshot = await session.withTransaction(async () => {
    const records = [];
    for (const collection of collections) records.push({ name: collection.name, data: await db.collection(collection.name).find({}, { session }).toArray() });
    return records;
  }, { readConcern: { level: 'snapshot' } });
  const output = new URL('../../exports/', import.meta.url);
  await mkdir(output, { recursive: true });
  const outputPath = fileURLToPath(output);
  const manifest = { source: 'MongoDB Atlas', database: config.databaseName, exportedAt: new Date().toISOString(), excludedOperationalCollections: operationalCollections, collections: [] };
  for (const collection of snapshot) {
    const file = exportFilename(collection.name);
    const contents = serialiseCollection(collection.data);
    await writeFile(join(outputPath, file + '.tmp'), contents);
    await rename(join(outputPath, file + '.tmp'), join(outputPath, file));
    manifest.collections.push({ name: collection.name, file, count: collection.data.length, sha256: createHash('sha256').update(contents).digest('hex') });
  }
  await writeFile(join(outputPath, 'manifest.json.tmp'), JSON.stringify(manifest, null, 2) + '\n');
  await rename(join(outputPath, 'manifest.json.tmp'), join(outputPath, 'manifest.json'));
  console.info('Atlas export complete: ' + manifest.collections.map((item) => item.name + ' (' + item.count + ')').join(', '));
} finally {
  await session.endSession();
  await client.close();
}
