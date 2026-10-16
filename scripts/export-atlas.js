import { mkdir, writeFile, rename } from 'node:fs/promises';
import { readConfig } from '../src/config.js';
import { connectDatabase } from '../src/database.js';
import { serialiseCollection, exportFilename } from '../src/export-data.js';

const config = readConfig();
const { client, db } = await connectDatabase(config);
const session = client.startSession();
try {
  const collections = (await db.listCollections({}, { nameOnly: true }).toArray())
    .filter((collection) => !collection.name.startsWith('system.')).sort((a, b) => a.name.localeCompare(b.name));
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
  const manifest = { source: 'MongoDB Atlas', database: config.databaseName, exportedAt: new Date().toISOString(), collections: [] };
  for (const collection of snapshot) {
    const file = exportFilename(collection.name);
    await writeFile(new URL(file + '.tmp', output), serialiseCollection(collection.data));
    await rename(new URL(file + '.tmp', output), new URL(file, output));
    manifest.collections.push({ name: collection.name, file, count: collection.data.length });
  }
  await writeFile(new URL('manifest.json.tmp', output), JSON.stringify(manifest, null, 2) + '\n');
  await rename(new URL('manifest.json.tmp', output), new URL('manifest.json', output));
  console.info('Atlas export complete: ' + manifest.collections.map((item) => item.name + ' (' + item.count + ')').join(', '));
} finally {
  await session.endSession();
  await client.close();
}
