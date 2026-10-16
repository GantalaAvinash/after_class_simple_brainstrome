import { BSON } from 'mongodb';

export function serialiseCollection(records) {
  return BSON.EJSON.stringify(records, null, 2, { relaxed: false }) + '\n';
}

export function exportFilename(name) {
  return encodeURIComponent(name) + '.json';
}
