// Test-only adapter. Production always uses the MongoDB native driver.
// Its rollback/serialisation verifies application flow, not MongoDB's engine.
import { ObjectId } from 'mongodb';
export function clone(value) {
  if (value instanceof ObjectId) return new ObjectId(value.toHexString());
  if (value instanceof Date) return new Date(value);
  if (Array.isArray(value)) return value.map(clone);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)]));
  return value;
}
function equal(a, b) { return a instanceof ObjectId ? a.equals(b) : a === b; }
function matches(doc, query) {
  return Object.entries(query).every(([key, expected]) => {
    const values = key === 'items.lessonId' ? (doc.items || []).map((item) => item.lessonId) : [doc[key]];
    return values.some((value) => expected?.$in ? expected.$in.some((item) => equal(value, item)) : equal(value, expected));
  });
}
export function testDatabase(seed = {}) {
  const state = clone({ lesson: [], teacher: [], order: [], ...seed });
  let queue = Promise.resolve();
  const controls = { failOnUpdate: 0, updates: 0 };
  const db = {
    command: async () => ({ ok: 1 }),
    collection(name) {
      state[name] ||= [];
      return {
        find: (query = {}) => ({ toArray: async () => clone(state[name].filter((doc) => matches(doc, query))) }),
        findOne: async (query) => clone(state[name].find((doc) => matches(doc, query)) || null),
        insertOne: async (doc) => {
          if (doc.requestId && state[name].some((item) => item.requestId === doc.requestId)) {
            const error = new Error('Duplicate request ID'); error.code = 11000; throw error;
          }
          const record = clone({ ...doc, _id: doc._id || new ObjectId() });
          state[name].push(record);
          return { insertedId: record._id };
        },
        updateOne: async (query, update) => {
          controls.updates++;
          if (controls.failOnUpdate === controls.updates) throw new Error('Simulated write failure');
          const doc = state[name].find((item) => matches(item, query));
          if (!doc) return { matchedCount: 0, modifiedCount: 0 };
          Object.assign(doc, clone(update.$set));
          return { matchedCount: 1, modifiedCount: 1 };
        },
        createIndex: async () => {},
      };
    },
  };
  const client = {
    startSession: () => ({
      async withTransaction(callback) {
        let release;
        const previous = queue;
        queue = new Promise((resolve) => { release = resolve; });
        await previous;
        const snapshot = clone(state);
        try { return await callback(); }
        catch (error) { for (const key of Object.keys(state)) state[key] = snapshot[key] || []; throw error; }
        finally { release(); }
      },
      endSession: async () => {},
    }),
  };
  return { db, client, state, controls };
}
