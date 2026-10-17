# AfterClass backend

## Development provenance

The requesting user is a developer providing paid assistance to a separate student. OpenAI Codex generated or edited implementation, tests and documentation under that developer's direction. Direct student contributions and independent review are not verified here. See the combined repository's [student handover](https://github.com/GantalaAvinash/after_class_simple_brainstrome/blob/main/STUDENT_HANDOVER.md) and [assistance record](https://github.com/GantalaAvinash/after_class_simple_brainstrome/blob/main/AI_ACKNOWLEDGEMENT.md). The student should confirm permitted assessment use and required disclosure with the module team.

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
  "email": "ava@example.test",
  "items": [{"lessonId": "100000000000000000000001", "quantity": 2}]
}
~~~

Email is optional: omit it or send an empty string for the original coursework contract. A supplied address is trimmed, limited to 254 characters and validated on the server; it is saved with the order, without sending email. Blank email is omitted from normalisation so old unfinished orders keep the same payload hash. Changing email for an existing request ID returns 409. API JSON responses carry Cache-Control: no-store; static images keep their own caching policy.

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

Import postman/AfterClass.postman_collection.json into Postman. Full collection execution modifies stock and profiles; use a separate test service/database. Set baseUrl to the real Render URL only for individual, deliberately selected demonstration requests. New order generates a fresh UUID; Confirm order reuses its saved ID/updates. The replay request tests duplicate safety. General PUT intentionally changes persistent attributes, so practise against test data.

The collection now contains 37 requests. For the protected folder set adminUsername/adminPassword as private local environment variables, then run Admin sign-in. CRUD uses separate test lesson/teacher records and revision values. Teacher assignment advances affected lesson revisions; refresh a lesson before editing it afterwards. Never export a populated password/token. The generated artifact contains neither.

The export command reads every nonsystem assessment collection in a snapshot transaction and writes canonical Extended JSON to the sibling exports folder. ObjectIds and dates are preserved for re-import. The manifest records actual collection names, counts and SHA-256 checksums. Seed data is not presented as an Atlas export.

Operational adminSession/adminLoginAttempt collections are excluded from exports and refused by packaging. adminAudit remains assessment evidence. The packager additionally refuses .admin-local.txt.

## Hosted verification

After the real addresses are saved in the workspace submission-links.json, run npm run check:deployment. This read-only check verifies GitHub Pages assets and API configuration, Render database health, catalogue/detail/teacher/enrolment/image routes, the Pages CORS origin and anonymous rejection on protected administration routes. It refuses missing/invalid hosted addresses and makes no orders or stock changes. Complete hosted browser checkout, admin sign-in and restart-persistence checks separately.

## Render and submission

The current Render service uses the combined repository with root directory backend; the separate private backend repository is retained and synchronised for assessment history. Use Node 24, npm ci, npm start, health path /health, and the provider's PORT. Name the service with the actual student number. Supply credentials through Render environment settings. For GitHub Pages, FRONTEND_ORIGINS must be the origin without its repository path or trailing slash.

Deployment, actual Postman execution and assessment export passed on 17 October 2026. See root SUBMISSION_GUIDE.md for packaging. From the combined checkout use npm run package:submission -- --source-workspace /absolute/path/to/workspace-containing-two-repositories. The packager checks clean independent Git histories, matching repository URLs, source synchronisation, real exports and passing Postman evidence before producing a ZIP under 10MB. Git internals are excluded from the delivered archive; rebuilding needs the original checkouts.

## Images and assistance

public/images contains twelve unmodified Lucide 0.468.0 SVGs. Mapping/source: public/images/ATTRIBUTION.md. Licence: public/images/LICENSE.lucide. No icon JavaScript library is used.

The root AI_ACKNOWLEDGEMENT.md records actual assistance. Review the code independently before the assessed demonstration.

## Current combined-repository deployment

- Source: https://github.com/GantalaAvinash/after_class_simple_brainstrome
- Frontend: https://gantalaavinash.github.io/after_class_simple_brainstrome/
- API lessons: https://afterclass-21j41a62f1.onrender.com/lessons

The service is configured from this combined repository. Hosted verification and restricted-network restart passed on 17 October 2026; see the root VERIFICATION.md. The original frontend/backend repositories remain available separately for coursework history.

## Executed Postman checks

The official Newman 6.2.3 runner executed the actual collection: 37 requests/52 assertions passed on real Atlas test data; 14 read-only hosted requests/23 assertions passed. The runner injects ephemeral test credentials in memory, allocates fresh fixture IDs and removes its own records. It saves only allowlisted evidence, never raw reports or populated environments. Install Newman separately from production dependencies and follow root SUBMISSION_GUIDE.md.

## Request timing and Safari login transport

POST /admin/session accepts either the existing JSON object or application/x-www-form-urlencoded fields username/password. Both use the same validation, salted scrypt verification, global rate limit and session handling. Browser login uses form encoding to avoid a cross-origin preflight before verifying a password. All coursework order/PUT requests retain their JSON contracts.

CORS returns an explicit empty 200 permission response with Content-Length: 0 and no entity ETag; Access-Control-Max-Age: 600 lets the browser reuse permission decisions. Every protected request still checks its bearer session in MongoDB. Allowed origins remain exact matches. X-Request-Id links a response to its log entry, and Server-Timing reports application duration and login phases auth_db, password and session_db. Logs contain start/end times and durations, never credentials, tokens or request bodies. Timing-Allow-Origin/Expose-Headers apply only to allowed origins.

The production listener uses 120-second keep-alive/header timeouts, exceeding Render’s documented 75-second upstream reuse interval. Node’s default five-second idle cutoff can otherwise leave the proxy attempting to reuse a closed socket. The listener integration test confirms that the same connection survives beyond the default cutoff. See src/http-server.js and Render’s runtime-error guidance.
