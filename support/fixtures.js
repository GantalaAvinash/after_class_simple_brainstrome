import { readFile } from 'node:fs/promises';
import { ObjectId } from 'mongodb';

export async function fixtures() {
  const seed = JSON.parse(await readFile(new URL('../data/seed.json', import.meta.url), 'utf8'));
  return {
    lesson: seed.lessons.map((record) => ({ ...record, _id: new ObjectId(record._id) })),
    teacher: seed.teachers.map((record) => ({ ...record, _id: new ObjectId(record._id), lessonIds: record.lessonIds.map((id) => new ObjectId(id)) })),
  };
}
