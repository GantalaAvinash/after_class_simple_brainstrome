# AfterClass submission guide

Configured student number: **21j41a62f1**, supplied by the developer; the student must confirm it is their required identifier. Prepared on **17 October 2026**. The application uses fictitious programmes, teachers and contact details, and processes no payments.

## Contributor roles and learning handover

The requesting user is the developer providing paid assistance; Codex generated or edited the implementation and documents under their direction. The student is the assessment candidate and their own contributions/review have not been verified here. The included AI_ACKNOWLEDGEMENT.md records both paid developer and AI involvement. Confirm permitted assessment use/disclosure with the module team before submitting externally commissioned work. Source history and technical checks do not establish student authorship.

[STUDENT_HANDOVER.md](STUDENT_HANDOVER.md) provides architecture and code explanations, local practice exercises, troubleshooting, access handover and an uncompleted independent-readiness record. Use DEMO_GUIDE.md for a timed preparation session.

## Required links

| Item | Link |
|---|---|
| Frontend repository | https://github.com/GantalaAvinash/afterclass-frontend |
| Backend repository (private) | https://github.com/GantalaAvinash/afterclass-backend |
| GitHub Pages app | https://gantalaavinash.github.io/after_class_simple_brainstrome/ |
| Render lessons endpoint | https://afterclass-21j41a62f1.onrender.com/lessons |
| Combined deployment source | https://github.com/GantalaAvinash/after_class_simple_brainstrome |

The separate repositories contain genuine development histories and are synchronised with the source in this archive. PACKAGE_MANIFEST.json records their exact commits, counts and per-file SHA-256 values. Pages and Render deploy from the combined repository. Arrange assessor access to the private backend repository before submission; a private URL alone does not grant access.

## Archive contents

- frontend/: Vue application, Studio, tests, local Vue distribution and licences.
- backend/: Express/MongoDB application, tests, image assets/licences, seed, API documentation, locked dependencies and maintenance scripts.
- exports/: actual Atlas lesson, teacher, order and adminAudit snapshots, with collection counts/checksums in manifest.json.
- AfterClass.postman_collection.json: 37-request Postman v2.1 collection, also retained under backend/postman/.
- verification/: sanitised execution reports and responsive/hosted screenshots.
- README.md, VERIFICATION.md, AI_ACKNOWLEDGEMENT.md, DEMO_GUIDE.md, STUDENT_HANDOVER.md, this guide, submission-links.json and PACKAGE_MANIFEST.json.

Dependencies, Git internals, environment files, operator passwords, raw credential-bearing reports, session/login-counter collections, temporary files and supplied assessment PDFs are excluded. The archive limit is enforced as less than 10,000,000 bytes. An adjacent .sha256 file identifies the exact ZIP.

## Clean installation from the ZIP

Use Node 24 and Python 3. Extract into a new folder. The delivered archive has no dependencies or credentials.

```sh
cd backend
npm ci
npm test
cd ../frontend
node --test test/*.test.mjs
```

Expected application results: 52 backend checks pass and three native tests are explicitly skipped without a private Atlas test connection; all 28 frontend checks pass. Real native Atlas behaviour was separately verified with all three tests passing; see the evidence rather than treating a skipped run as proof.

For a disposable local browser demonstration, run npm run preview:test in backend and open http://127.0.0.1:8081. This is visibly labelled fixture data. Stop any existing preview on that port first. It does not connect to assessment data.

For a real integration, copy backend/.env.example to backend/.env and privately configure MONGODB_URI, DATABASE_NAME, FRONTEND_ORIGINS and optional Studio credentials. Use database-scoped users and appropriate Atlas access rules. npm run check:atlas verifies a rolled-back write; npm run seed inserts missing seed records without resetting stock; npm start starts Express. Serve frontend on port 8080 and set its local config.js API origin to http://localhost:3000. The committed production configuration points to Render. Never upload a populated .env.

## Reproduce the Postman checks

Newman is the official Postman collection runner. The recorded checks execute the exported Postman scripts through Newman; no manual desktop Postman run is claimed. Install the pinned runner in separate tooling, keeping production dependencies unchanged:

```sh
npm install --prefix /tmp/afterclass-newman-tools --no-audit --no-fund newman@6.2.3
cd backend
NEWMAN_MODULE_PATH=/tmp/afterclass-newman-tools/node_modules/newman node scripts/check-postman.js hosted-read-only
NEWMAN_MODULE_PATH=/tmp/afterclass-newman-tools/node_modules/newman node --env-file=.env scripts/check-postman.js atlas-test
```

The hosted command selects only 14 GET requests; expected result is 23 passing assertions. The full command needs MONGODB_TEST_URI and MONGODB_TEST_DATABASE ending in _test, distinct from DATABASE_NAME. It starts the actual Express application on a temporary loopback port, creates twelve uniquely identified lessons and four teachers in real Atlas, uses an ephemeral test administrator, executes all 37 requests/52 assertions and removes its own fixtures. It does not drop the database or use production admin credentials. Reports contain only names, paths, HTTP statuses, assertion outcomes and counts. The runner's Node 24 dependency deprecation warning does not indicate an application failure.

For desktop Postman, import the collection and configure a private local environment. Run full mutations only against a dedicated test service/database. The collection purchases a place and sets one lesson's spaces to five and price to nine. Select individual live demonstration requests deliberately; do not run the entire collection against assessment stock. Never export populated passwords, bearer tokens or environment values.

## Atlas exports and restoration

The snapshot is from the real assessment database afterclass, not the seed file or test database. It contains 12 lessons, five teacher records (four active and the soft-deleted QA teacher), one confirmed fictitious order and five audit events. Coding Club has three spaces and two purchased places; Art Workshop has four spaces and one purchased place. The single order retains its leading-zero phone string. There are 57 available places in total. Later live changes may differ from this dated snapshot.

exports/manifest.json records the database, UTC export time, excluded operational collections, per-file record counts and SHA-256 checksums. Strict MongoDB Extended JSON preserves ObjectIds, dates and numeric types. adminSession/adminLoginAttempt are operational authentication state and intentionally excluded. adminAudit is included as assessment evidence.

To inspect, open the export JSON files and manifest. To restore, use MongoDB Database Tools mongoimport into an **empty, separate restoration database** with a user scoped to that database. Import each file as a JSON array into the corresponding collection. Select Extended JSON where an import tool offers a format choice; do not convert ObjectIds/dates to plain strings. Do not import over the live assessment database. For example, using a restore user's interactive password prompt:

```sh
mongoimport --uri 'mongodb+srv://YOUR_CLUSTER_HOST/' --username YOUR_RESTORE_USER --authenticationDatabase admin --db afterclass_restore --collection lesson --file exports/lesson.json --jsonArray
```

Repeat with teacher, order and adminAudit and their matching files. Configure the app to that restored database, then start it to establish the unique request-ID and operational TTL indexes. Recheck counts/associations and confirmed quantities. Passwords and database access must be configured privately; none is supplied in this ZIP.

To produce a fresh actual export, run npm run export:atlas from backend with the assessment connection in ignored .env. The exporter uses a snapshot transaction, sequential reads and atomic file replacement. Never substitute seed data for a live export.

## Rebuild the package

Packaging requires Git checkouts, so the extracted ZIP alone cannot prove development history. Synchronise and commit the source in the combined checkout and the two separate coursework repositories. From the combined backend folder:

```sh
npm run package:submission -- --source-workspace /absolute/path/to/workspace-containing-frontend-and-backend-checkouts
```

The packager checks independent repository roots, matching origins, clean trees, at least ten commits each, byte-identical application source, actual export checksums/counts and passing Postman reports. It includes committed evidence and complete documentation, refuses private paths/credential patterns, adds a per-file manifest, checks CRC/content equality and enforces the size limit. output/AfterClass-submission.zip and its .sha256 file remain local.

## Assessment coverage and evidence

| Area | Implementation | Evidence |
|---|---|---|
| Vue catalogue, eight sorts, cart and validation | frontend/app.js, state.mjs, checkout.mjs | Frontend tests; hosted walkthrough and phone/tablet screenshots |
| Fetch, routes, middleware and images | frontend/api.mjs; backend/src/app.js, middleware.js and route modules | HTTP/backend tests, actual Postman execution and hosted checker |
| Orders, absolute updates and integrity | backend/src/orders.js, updates.js | Postman pending/confirm/replay; native Atlas rollback/concurrency/idempotency tests |
| Backend search, teacher filter, enrolment | backend/src/catalogue.js, enrolment.js | Postman challenges, hosted filters and persisted purchased quantities |
| Detailed lessons and protected teacher/lesson CRUD | lesson-route.mjs, admin-app.js; backend/src/admin.js, teachers.js | Regression/native assignment-race tests, Studio walkthrough and responsive screenshots |
| Deployment and persistence | Pages workflow, Render and Atlas | Hosted checks and restricted-network Render restart baseline comparison |
| Source, provenance and exports | Separate Git histories; exports/; acknowledgement | PACKAGE_MANIFEST.json, Atlas manifest, verification reports and AI record |

The optional Studio and design extensions carry no guaranteed mark improvement. The coursework features take priority.

## Student actions still required

Confirm permitted use/disclosure of paid developer and AI assistance with the module team. Review and understand the assisted implementation and acknowledgement; record any genuine subsequent independent work. Perform the ten-minute rehearsal independently using DEMO_GUIDE.md. Confirm the submission portal's deadline/timezone (the brief states 14 December at 11pm), upload the ZIP and enter the four required links. Verify the uploaded archive and repository access. Book and attend the scheduled assessed demonstration before the deadline, without AI assistance as required by the handbook. Packaging and automated checks do not establish student understanding or constitute portal submission.
