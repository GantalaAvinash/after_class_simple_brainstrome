# AfterClass Studio API and operating notes

All admin routes return `Cache-Control: no-store`. Send JSON with `Content-Type: application/json`. After sign-in, send `Authorization: Bearer TOKEN`. Tokens have a fixed 30-minute lifetime; the server checks expiry and the current credential fingerprint on every protected request. No public registration exists.

## Configure and recover access

Run `npm run admin:setup`. It generates a random password and writes only its salted scrypt hash and the username `operator` to ignored `.env`. Read the mode-0600 `.admin-local.txt` privately, move the password to your password manager and delete that bootstrap file. It is ignored by Git and explicitly rejected by the submission packager. This file is a temporary local handover, not application storage.

Use `npm run admin:setup -- --rotate` to generate replacement credentials, then restart the service. Existing sessions fail the new credential fingerprint check. For Render set `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` through environment settings, use HTTPS, and never enable fixture preview in production. Missing credentials disable admin sign-in; invalid partial credentials fail startup.

Login attempts are counted atomically in MongoDB: ten attempts total per fixed 15-minute window, including successful attempts and unknown usernames. The single-operator global limit prevents username/IP evasion, but can temporarily block the operator if deliberately exhausted. It resets at the next window. TTL indexes clean expired counters/sessions; expiry checks never depend on timely TTL cleanup. Repeated guessing does not reset a session or reveal whether a username exists.

Browser tokens live only in a JavaScript closure, with no cookie, localStorage or sessionStorage persistence. Reload requires sign-in again; the now-unreachable server session expires normally. Bearer headers support separate GitHub Pages/Render origins without third-party cookies and are not automatically attached by another site's forms. There is no MFA/multi-user administration in this local extension.

## Endpoints

| Method/path | Request | Success | Specific failures |
|---|---|---|---|
| POST /admin/session | `{username,password}` | 201 `{token,username,expiresAt}` | 401 invalid credentials; 429 throttled with Retry-After seconds; 503 not configured |
| GET /admin/session | Bearer header | 200 `{username,expiresAt}` | 401 missing, invalid, expired or rotated session |
| DELETE /admin/session | Bearer header | 200 `{signedOut:true}` | 401 invalid session |
| GET /admin/lessons | Bearer header | 200 `{lessons,images}` including deleted records, revisions and teacher IDs | 401 invalid session |
| GET /admin/overview | Bearer header | 200 `{stats,lessons,recentActivity}` | 401 invalid session |
| POST /admin/lessons | Create body below | 201 `{lesson}`; exact replay returns the original result | 400 invalid DTO; 401 invalid session; 404 missing teacher; 409 request-ID conflict |
| PUT /admin/lessons/:id | Full create body plus `revision` | 200 `{lesson}` | 400 invalid DTO/ID; 401 invalid session; 404 missing record/teacher; 409 stale revision/deleted record/request-ID conflict |
| DELETE /admin/lessons/:id | `{requestId,revision}` | 200 `{lesson}` with `deleted:true` | 400 invalid DTO/ID; 401 invalid session; 404 missing record; 409 stale revision/already deleted/request-ID conflict |
| POST /admin/lessons/:id/restore | `{requestId,revision}` | 200 `{lesson}` with `deleted:false` | 400 invalid DTO/ID; 401 invalid session; 404 missing record; 409 stale revision/already active/request-ID conflict |
| GET /admin/teachers | Bearer header | 200 teacher array including deleted profiles and revisions | 401 invalid session |
| POST /admin/teachers | Teacher create body below | 201 `{teacher}`; exact UUID replay returns original result | 400 invalid fields; 401 invalid session; 404 missing lesson; 409 UUID conflict |
| PUT /admin/teachers/:id | Full teacher create body plus `revision` | 200 `{teacher}` | 400 invalid fields/ID; 401 invalid session; 404 missing record/lesson; 409 stale revision/deleted profile/UUID conflict |
| DELETE /admin/teachers/:id | `{requestId,revision}` | 200 `{teacher}` with `deleted:true` | 400 invalid request/ID; 401 invalid session; 404 missing record; 409 stale/already deleted/UUID conflict |
| POST /admin/teachers/:id/restore | `{requestId,revision}` | 200 `{teacher}` with `deleted:false` | 400 invalid request/ID; 401 invalid session; 404 missing record/lesson; 409 stale/already active/UUID conflict |
| PUT /lessons (no orderId) | Existing coursework batch DTO, Bearer header | 200 `{lessons}`; absolute values, all editable fields | 400 invalid DTO; 401 invalid session; 404 missing/deleted lesson; 409 write conflict |

All routes can also return 403 for a disallowed browser Origin, 413 for a JSON body above 20KB, safe 500 for unexpected database failures, or 503 when transactional writes cannot start. Errors are `{error: "Readable message."}`. Identifiers are native MongoDB ObjectIds represented as 24-character hexadecimal strings on the wire. No customer names or phones are returned by overview.

Create example:

```json
{
  "requestId": "00000000-0000-4000-8000-000000000002",
  "lesson": { "topic": "Creative Robotics", "location": "Hendon", "price": 25.5, "space": 8, "image": "/images/robotics.svg" },
  "teacherIds": ["200000000000000000000001"]
}
```

Update the complete editable lesson fields and current teacher membership together. Subject/location are nonempty text up to 100 characters; price is nonnegative with at most two decimal places; spaces are a nonnegative safe integer. Images must be one of the twelve supplied SVG paths. Arbitrary fields, URLs and MongoDB operators are rejected. Teacher IDs must exist, be active and be unique. Empty teacher membership is permitted.

## Detail content and teacher contracts

Optional editable lesson fields: description (plain text up to 2,000 characters), ageGroup (up to 60), durationMinutes (integer 1–480 or null), learningOutcomes (up to eight nonempty strings, each up to 160). Empty text/arrays intentionally clear content. Existing records can omit these fields; public pages show a missing-content state. Public `GET /lessons/:id` returns `{lesson,teachers}` for active lessons; invalid IDs return 400 and missing/deleted lessons return 404. Public `GET /teachers` excludes deleted profiles; a deleted teacher filter returns 404.

Teacher create example; updates add the current revision and send the full profile/assignment set:

```json
{
  "requestId": "00000000-0000-4000-8000-000000000003",
  "teacher": {"firstName":"Alex","lastName":"Morgan","specialism":"Creative technology","bio":"A fictitious example profile."},
  "lessonIds": ["100000000000000000000003"]
}
```

First/last names are required, up to 60 characters with Unicode letters/marks, spaces, apostrophes and hyphens. Optional specialism is up to 100 characters and bio up to 2,000. All are plain text. Choose up to 100 unique existing lesson IDs; deleted lesson associations may be retained but never expose deleted lessons publicly. Delete/restore accepts only requestId and revision.

Teacher membership has one owner: teacher.lessonIds. Lesson views derive teacher IDs. Changes to membership on either editor advance the affected record revisions on the other side. Native transaction conflicts and expected revisions prevent two stale forms silently overwriting assignments. Teacher changes never set spaces, prices or order history. Soft deletion hides the teacher publicly, retains associations, and restore makes the active memberships visible again.

For older seeded databases, `npm run seed:details` fills only missing descriptive fields, not authored blanks, spaces, associations or orders. It is scoped to existing seed IDs and advances changed revisions. It has been tested against the adapter; it has not been run on Atlas.

## Transactions, revisions and recovery

Create starts revision 1. Existing seed records without a revision are interpreted as revision 0. Every admin edit, general PUT and successful booking increments it. Admin writes check the expected revision inside the transaction, so a form opened before a purchase cannot put sold spaces back. On a 409, refresh and reopen the lesson; the form never silently overwrites the new record.

The admin audit UUID is a unique operation key. An audit entry and its lesson/teacher writes share one transaction. A repeated UUID with identical normalised details returns the original result without a second mutation or audit entry. Reusing a UUID for a different operation returns 409. A lost response leaves the same mutation payload/UUID in sessionStorage, separate from authentication; after signing in again use **Retry saved change**. Network/server uncertainty locks new mutations until resolved. Definitive 400/404/409 errors unlock for correction. General coursework PUT uses absolute values and is retry-safe for the fields it sets, but adds an audit entry for each call and intentionally does not implement management UUID replay.

Delete is a soft deletion: public GET/search/teacher results exclude the record; new orders reject it. Confirmation checks deletion, expected stock and saved unit price inside the transaction. Deleting or changing price during an unfinished checkout produces a conflict with no partial stock deductions. Confirmed-order replay never deducts again. Enrolment remains based on confirmed quantities and can be queried for a deleted lesson. Restore preserves stock, history and teacher membership.

`adminAudit` records operator, operation, time, lesson changes and teacher profile/assignment changes. `adminSession` contains token digests, never plaintext tokens; `adminLoginAttempt` contains counters. Both operational collections are excluded from Atlas exports and refused by packaging. `adminAudit` remains assessment evidence. No customer contact details, password hashes or bearer tokens are placed in audit records or request logs.

Overview is a small-catalogue reporting read, not a transactional accounting statement. It excludes pending orders and calculates booking value from saved unit prices using integer pence. It may reflect adjacent concurrent reads while bookings are happening; refresh for the latest view. No payment is taken by this fictitious service.

## Verification and limits

`npm test` verifies sessions, permissions, revisions, replay, CRUD, associations, rollback, price conflicts, history and export exclusions using an explicit adapter and real HTTP. `npm run test:atlas` runs isolated native MongoDB concurrency/rollback tests only with a separate `_test` database configured. These are distinct levels of evidence; local adapter passes do not prove Atlas behaviour.

This is an educational single-operator implementation, not a claim of external security certification. The coursework stack is preserved. Architecture decisions: [001-admin-extension.md](adr/001-admin-extension.md) and [002-details-and-teachers.md](adr/002-details-and-teachers.md).

Implementation references: [Node crypto](https://nodejs.org/docs/latest-v24.x/api/crypto.html), [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [MongoDB compound operations](https://www.mongodb.com/docs/drivers/node/current/crud/compound-operations/).
