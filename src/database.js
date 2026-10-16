import { MongoClient } from 'mongodb';

export async function connectDatabase({ uri, databaseName }) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db(databaseName);
    await db.command({ ping: 1 });
    await db.collection('order').createIndex({ requestId: 1 }, { unique: true });
    return { client, db };
  } catch {
    await client.close();
    // Connection errors can contain infrastructure details; never echo the URI.
    throw new Error('Atlas connection failed. Check database credentials and the Atlas IP access list.');
  }
}
