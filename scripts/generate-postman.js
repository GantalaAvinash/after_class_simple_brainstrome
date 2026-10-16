import { mkdir, writeFile } from 'node:fs/promises';

const status = (code) => ['pm.test("Expected HTTP status", () => pm.response.to.have.status(' + code + '));'];
const array = [...status(200), 'pm.test("Returns an array", () => pm.expect(pm.response.json()).to.be.an("array"));'];
function request(name, method, path, body, tests = status(200), before = []) {
  return {
    name,
    request: {
      method, header: body === undefined ? [] : [{ key: 'Content-Type', value: 'application/json' }],
      url: '{{baseUrl}}' + path,
      ...(body === undefined ? {} : { body: { mode: 'raw', raw: typeof body === 'string' ? body : JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } } }),
    },
    event: [
      ...(before.length ? [{ listen: 'prerequest', script: { type: 'text/javascript', exec: before } }] : []),
      { listen: 'test', script: { type: 'text/javascript', exec: tests } },
    ],
  };
}
const order = { requestId: '{{requestId}}', name: 'Ava', phone: '007123456', items: [{ lessonId: '{{lessonId}}', quantity: 1 }] };
const collection = {
  info: {
    name: 'AfterClass CST3144',
    description: 'Import into Postman. Set baseUrl to the real Render service for the assessed demonstration. Mutating requests change persistent data: practise against a test database first. Run New order before Confirm order. Seed IDs are included. No credentials are exported.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3000' },
    { key: 'lessonId', value: '100000000000000000000001' },
    { key: 'teacherId', value: '200000000000000000000001' },
    { key: 'requestId', value: '' }, { key: 'orderId', value: '' }, { key: 'orderUpdates', value: '[]' },
  ],
  item: [
    { name: 'Core API and checkout', item: [
      request('Health', 'GET', '/health'),
      request('All lessons', 'GET', '/lessons', undefined, [...array, 'pm.test("At least ten lessons", () => pm.expect(pm.response.json().length).to.be.at.least(10));']),
      request('New order — saves pending order', 'POST', '/orders', order, [
        ...status(201), 'const data = pm.response.json();',
        'pm.collectionVariables.set("orderId", data.orderId);',
        'pm.collectionVariables.set("orderUpdates", JSON.stringify(data.updates));',
        'pm.test("Pending order", () => pm.expect(data.status).to.equal("pending"));',
      ], ['pm.collectionVariables.set("requestId", pm.variables.replaceIn("{{$guid}}"));']),
      request('Confirm order — absolute space PUT', 'PUT', '/lessons',
        '{"orderId":"{{orderId}}","updates":{{orderUpdates}}}',
        [...status(200), 'pm.test("Confirmed order", () => pm.expect(pm.response.json().status).to.equal("confirmed"));']),
      request('Replay the same POST — no duplicate order', 'POST', '/orders', order, [
        ...status(200), 'pm.test("Same order ID", () => pm.expect(pm.response.json().orderId).to.equal(pm.collectionVariables.get("orderId")));',
      ]),
    ] },
    { name: 'Challenges', item: [
      request('Search all four fields — numeric example', 'GET', '/lessons?q=9', undefined, array),
      request('Case-insensitive location search', 'GET', '/lessons?q=HENDON', undefined, array),
      request('Teachers', 'GET', '/teachers', undefined, array),
      request('Lessons taught by Mina Patel', 'GET', '/lessons?teacherId={{teacherId}}', undefined, array),
      request('Combined teacher and search', 'GET', '/lessons?teacherId={{teacherId}}&q=math', undefined, array),
      request('Enrolment — confirmed purchased quantities', 'GET', '/enrolment/{{lessonId}}', undefined, [
        ...status(200), 'pm.test("Nonnegative enrolment", () => pm.expect(pm.response.json().enrolment).to.be.at.least(0));',
      ]),
    ] },
    { name: 'Manual attribute update — changes persistent stock', item: [
      request('Set absolute spaces to 5 and price to 9', 'PUT', '/lessons', {
        updates: [{ lessonId: '{{lessonId}}', changes: { space: 5, price: 9 } }],
      }),
    ] },
    { name: 'Middleware and invalid requests', item: [
      request('Existing image', 'GET', '/images/maths.svg'),
      request('Missing image', 'GET', '/images/not-present.svg', undefined, status(404)),
      request('Malformed lesson ID', 'GET', '/enrolment/bad-id', undefined, status(400)),
      request('Invalid name', 'POST', '/orders', { ...order, name: 'Ava2' }, status(400)),
      request('Forbidden field update', 'PUT', '/lessons', { updates: [{ lessonId: '{{lessonId}}', changes: { _id: 'forbidden' } }] }, status(400)),
    ] },
  ],
};
const output = new URL('../postman/', import.meta.url);
await mkdir(output, { recursive: true });
await writeFile(new URL('AfterClass.postman_collection.json', output), JSON.stringify(collection, null, 2) + '\n');
console.info('Postman collection generated: 17 requests, with no credentials.');
