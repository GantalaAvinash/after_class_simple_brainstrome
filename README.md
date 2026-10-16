# AfterClass backend

Node 24, Express 5.3.0 and official MongoDB Node driver 7.7.0. Production connects to MongoDB Atlas; there is no local MongoDB or fixture fallback.

## Setup

Run npm ci. Configure the ignored .env file with MONGODB_URI, DATABASE_NAME (default afterclass), and FRONTEND_ORIGINS. Use a database user with read/write access to the assessment database and a restricted Atlas IP access list. URI-encode reserved password characters. Keep credentials out of chat, Git, the frontend, Postman exports and ZIP files.

Run these separately:

~~~sh
npm run seed
npm run check:atlas
npm start
~~~

Seeding inserts missing lesson/teacher IDs using $setOnInsert and never resets purchased stock. For an existing database seeded before detailed content was added, run npm run seed:details. It fills only missing descriptive fields on the twelve seed lessons and four seed teachers, preserving stock, authored content, assignments and orders. It increments affected revisions. Startup creates the unique requestId index. The connection probe performs a transaction write and aborts it.

## API

| Method and path | Behaviour |
|---|---|
| GET /health | Database ping; 503 during a database outage |
| GET /lessons | JSON lesson array |
| GET /lessons?q=9&teacherId=ID | Optional server-side literal search and teacher filtering |
| GET /teachers | Active teacher profiles and associated lesson IDs |
| GET /lessons/:id | Active lesson details and its active teaching team |
| POST /orders | Validate and save/replay a pending order |
| PUT /lessons | Public constrained order confirmation; admin bearer required for general absolute updates |
| GET /enrolment/:lessonid | Sum quantities in confirmed orders for an existing lesson |
| GET /images/NAME.svg | Static lesson image or explicit missing-image error |

POST body:

~~~json
{
  "requestId": "00000000-0000-4000-8000-000000000001",
  "name": "Ava",
  "phone": "007123456",
  "items": [{"lessonId": "100000000000000000000001", "quantity": 2}]
}
~~~

POST returns orderId, status and the exact updates required for PUT. A repeated request ID with the same normalised payload returns the existing order; changed details return 409. Pending orders do not reduce spaces or contribute to enrolment.

Checkout PUT body uses the returned values:

~~~json
{
  "orderId": "REPLACE_WITH_RETURNED_ORDER_ID",
  "updates": [{"lessonId": "100000000000000000000001", "changes": {"space": 3}}]
}
~~~

Within a native-driver transaction, the server verifies every target, compares current stock with the saved snapshot, updates all lessons and confirms the order. A later failure rolls the whole transaction back. Repeated confirmation returns success without deducting stock again. Session operations are sequential.

A general PUT omits orderId and supports topic, location, price, space, image, description, ageGroup, durationMinutes and learningOutcomes. IDs and MongoDB operators cannot be changed or injected. Spaces are set to any valid nonnegative integer, including zero. Multiple general updates are atomic too.

Search executes in Node after the database query, using case-insensitive literal substrings of topic, location and stringified price/space. This intentionally simple scan fits the twelve-lesson coursework catalogue and uses no extra libraries. Teacher membership is restricted by the database query before searching. For a substantially larger catalogue, move the matching into indexed database queries.

Enrolment reads confirmed orders matching the lesson and sums quantities, rather than deriving purchases from available spaces. An order index supports this lookup. Pending/abandoned orders remain excluded.

Errors use a JSON error message: 400 invalid input, 403 disallowed browser origin, 404 missing record/image, 409 checkout conflict, 413 oversized body, and safe 500/503 server responses. Logs contain timestamp, method, URL, status and duration, without request bodies or database credentials.

## Protected administration

Run npm run admin:setup once, read ignored mode-0600 .admin-local.txt privately, save its generated password and remove the file. Restart the service. On Render set ADMIN_USERNAME and ADMIN_PASSWORD_HASH through environment settings. No default password or public registration exists. Rotate with npm run admin:setup -- --rotate and restart.

Studio includes create/edit/soft-delete/restore, teacher creation/profile editing/assignment/deletion/restoration, booking insights and audit history. Every management endpoint requires a valid opaque bearer session. Passwords use salted native scrypt; token digests and atomic login counters live in MongoDB with TTL indexes. See [docs/ADMIN_API.md](docs/ADMIN_API.md) for contracts, errors, recovery, tradeoffs and primary references.

Lesson writes, teacher membership and audit entries share a transaction. Revisions advance on purchases, general PUT and admin changes. Public results exclude deleted lessons; confirmed purchase quantities survive deletion. Checkout also checks saved unit price before confirming. General coursework PUT now requires authorisation and is audited; its complete saved-order confirmation branch remains public and cannot perform arbitrary changes.

The native test command runs booking, admin and opposite-side teacher assignment suites sequentially in a separate _test database. The explicit test:atlas command now fails before running if its URI is missing or its database is unsafe; regular npm test still reports native suites as skipped when not configured. Cleanup removes only each test's own records, never an existing database.

## Local verification

~~~sh
npm test
~~~

Local tests use real HTTP requests with an explicit test-only database adapter. Its rollback/serialisation checks application logic; it does not prove MongoDB engine behaviour.

To run the real Atlas test, set MONGODB_TEST_URI and MONGODB_TEST_DATABASE=afterclass_test in the ignored .env, using credentials permitted to write that separate test database:

~~~sh
npm run test:atlas
~~~

The test refuses the assessment database or a name without the _test suffix. It creates unique fixture IDs and removes only its own lesson/order records; it does not drop existing databases. It checks rollback, competing purchases, idempotency and enrolment. Without a test URI, npm run test:atlas fails clearly instead of reporting an all-skipped success.

## Fixture browser preview

~~~sh
npm run preview:test
~~~

Open http://127.0.0.1:8081. This serves the sibling frontend using test fixtures and shows a visible warning. The data resets on restart. support/preview.js is never loaded by npm start.

## Postman and actual Atlas exports

~~~sh
npm run postman
npm run export:atlas
~~~

Import postman/AfterClass.postman_collection.json into Postman. Set baseUrl to the real Render URL for the demonstration. New order generates a fresh UUID; Confirm order reuses its saved ID/updates. The replay request tests duplicate safety. General PUT intentionally changes persistent attributes, so practise against test data.

The collection now contains 37 requests. For the protected folder set adminUsername/adminPassword as private local environment variables, then run Admin sign-in. CRUD uses separate test lesson/teacher records and revision values. Teacher assignment advances affected lesson revisions; refresh a lesson before editing it afterwards. Never export a populated password/token. The generated artifact contains neither.

The export command reads every nonsystem assessment collection in a snapshot transaction and writes canonical Extended JSON to the sibling exports folder. ObjectIds and dates are preserved for re-import. The manifest records actual collection names, counts and SHA-256 checksums. Seed data is not presented as an Atlas export.

Operational adminSession/adminLoginAttempt collections are excluded from exports and refused by packaging. adminAudit remains assessment evidence. The packager additionally refuses .admin-local.txt.

## Hosted verification

After the real addresses are saved in the workspace submission-links.json, run npm run check:deployment. This read-only check verifies GitHub Pages assets and API configuration, Render database health, catalogue/detail/teacher/enrolment/image routes, the Pages CORS origin and anonymous rejection on protected administration routes. It refuses missing/invalid hosted addresses and makes no orders or stock changes. Complete hosted browser checkout, admin sign-in and restart-persistence checks separately.

## Render and submission

Connect the separate backend repository. Use Node 24, npm ci, npm start, health path /health, and the provider's PORT. Name the service with the actual student number. Supply credentials through Render environment settings. For GitHub Pages, FRONTEND_ORIGINS must be the origin without its repository path or trailing slash.

Once real links, tests and exports are ready, enter the root submission-links.json and run npm run package:submission. The package command checks both repositories and exports before producing a ZIP under 10MB. Actual deployment and export remain pending.

## Images and assistance

public/images contains twelve unmodified Lucide 0.468.0 SVGs. Mapping/source: public/images/ATTRIBUTION.md. Licence: public/images/LICENSE.lucide. No icon JavaScript library is used.

The root AI_ACKNOWLEDGEMENT.md records actual assistance. Review the code independently before the assessed demonstration.
