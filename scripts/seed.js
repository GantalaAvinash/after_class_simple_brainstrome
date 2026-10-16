import { readFile } from 'node:fs/promises';
import { ObjectId } from 'mongodb';
import { readConfig } from '../src/config.js';
import { connectDatabase } from '../src/database.js';

const config = readConfig();
const { client, db } = await connectDatabase(config);
try {
  const seed = JSON.parse(await readFile(new URL('../data/seed.json', import.meta.url), 'utf8'));
  for (const [name, records] of [['lesson', seed.lessons], ['teacher', seed.teachers]]) {
    const operations = records.map((record) => {
      const document = { ...record, _id: new ObjectId(record._id) };
      if (record.lessonIds) document.lessonIds = record.lessonIds.map((id) => new ObjectId(id));
      return { updateOne: {
        filter: { _id: document._id },
        // Re-running the seed must not reset places already purchased.
        update: { $setOnInsert: document },
        upsert: true,
      } };
    });
    await db.collection(name).bulkWrite(operations);
  }
  await db.collection('order').createIndex({ requestId: 1 }, { unique: true });
  await db.collection('order').createIndex({ status: 1, 'items.lessonId': 1 });
  console.info('Seed complete: 12 lesson IDs and 4 teacher IDs are present. Existing records were preserved.');
} finally {
  await client.close();
}
