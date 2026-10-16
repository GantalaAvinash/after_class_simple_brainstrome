import { ObjectId } from 'mongodb';
import { transaction } from './updates.js';

export async function backfillSeedDetails(db, client, seed) {
  let updated = 0;
  for (const [name, records, fields] of [
    ['lesson', seed.lessons, ['description','ageGroup','durationMinutes','learningOutcomes']],
    ['teacher', seed.teachers, ['specialism','bio']],
  ]) for (const record of records) {
    const changed = await transaction(client, async session => {
      const collection = db.collection(name);
      const _id = new ObjectId(record._id);
      const existing = await collection.findOne({ _id }, { session });
      if (!existing) return false;
      const missing = Object.fromEntries(fields.filter(key => existing[key] === undefined && record[key] !== undefined).map(key => [key,record[key]]));
      if (!Object.keys(missing).length) return false;
      await collection.updateOne({ _id }, { $set: { ...missing, updatedAt: new Date() }, $inc: { revision: 1 } }, { session });
      return true;
    });
    if (changed) updated++;
  }
  return updated;
}
