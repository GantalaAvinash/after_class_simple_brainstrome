import { readConfig } from '../src/config.js';
import { connectDatabase } from '../src/database.js';

const { client, db } = await connectDatabase(readConfig());
const session = client.startSession();
try {
  await db.command({ ping: 1 });
  session.startTransaction();
  await db.collection('order').insertOne({ connectionProbe: true }, { session });
  // Deliberately roll the probe back; this never creates a purchased order.
  await session.abortTransaction();
  console.info('Atlas ping and transaction-write checks passed. The probe was rolled back.');
} catch {
  console.error('Atlas transaction check failed. Verify cluster support and database write permissions.');
  process.exitCode = 1;
} finally {
  if (session.inTransaction()) await session.abortTransaction();
  await session.endSession();
  await client.close();
}
