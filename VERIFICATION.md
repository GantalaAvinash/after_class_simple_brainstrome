# Verification log — 16 October 2026

## Automated local checks

| Check | Evidence |
|---|---|
| Backend suite | 50 application/HTTP tests passed; 3 real-Atlas tests skipped pending the separate test URI |
| Frontend suite | 28 tests passed across coursework state, admin/recovery, discovery, details, teachers and actual Vue template compilation |
| Postman artifact | 37 requests generated; JSON and all script syntax validated; not yet imported/executed in Postman |
| Export format | Native Extended JSON round-trip preserves IDs, dates and quantities; actual export pending |
| Clean install | npm ci recreated locked dependencies successfully |
| Dependency audit | Zero known vulnerabilities at the last npm audit on 16 October |
| Frontend syntax | app.js and supporting modules accepted by Node syntax checks |
| Packaging preflight | Refuses to produce a final ZIP without actual hosted links and exports |
| Credentials | .env and .admin-local.txt are ignored; source/artifact scan found no generated credential values; exported Postman secrets are blank |

All local database/HTTP tests use an explicit adapter. Mock transaction success is not represented as an Atlas transaction result.

## Browser checks — Chrome guest window, local fixture preview

- Loaded all twelve lesson cards and local images.
- Exhausted a lesson: add button remained visible and disabled at zero.
- Removed a place and verified quantity/total restoration.
- Invalid name kept checkout disabled; valid name and a leading-zero phone enabled it.
- Submitted four Art Workshop places; confirmed message appeared, cart cleared and availability became one.
- Enrolment displayed four purchased places.
- Numeric search 9 returned prices 9 and 19; selecting Mina Patel narrowed it to Maths.
- Clearing filters retained a newly selected Maths place.
- Removing the final cart item returned to the catalogue and disabled its cart button.
- Reviewed responsive layouts at widths 375, 768, 1024 and 1440.
- Fixed missing favicon, singular/plural labels and stale success feedback on starting another basket.
- Console was empty after the favicon fix and reload.
- Pending-checkout persistence/lost-response behaviour is covered by unit tests; a complete browser interruption/reload scenario is not claimed as tested.

## Admin/design extension browser checks

- Used an explicitly isolated fixture operator and password for browser QA. These are temporary process credentials, not the user's generated operator password. The final preview is restarted with the private .env configuration and standard fixtures.
- Verified public shortlist persistence, saved-only filtering with an intact basket, and a successful Art Workshop checkout using Ava/007123456. That fixture run cleared the basket and updated stock.
- Signed into Studio, created QA Design Club with Mina Patel, edited its absolute spaces, deleted it with the native dialog, viewed it under Deleted lessons and restored it.
- Verified lesson/availability summaries and the create/update/delete/restore audit sequence in insights. The QA fixture was reset at the end; it is not seed/Atlas data.
- Inspected desktop layouts, iPhone SE 375×667 and iPad Mini 768×1024. No horizontal clipping was observed in inspected navigation, cards, filters or metrics. Earlier 1024/1440 checks above predate the redesign.
- Final browser review caught HTML formatting that broke inline Vue string expressions. Corrected the expressions, protected the in-DOM templates from the HTML-only formatter, and added tests compiling both pages with the actual pinned Vue compiler. Studio rendered again and the console was empty.
- Application tests cover anonymous denial on every admin endpoint, fixed server expiry, logout, credential rotation, database login throttling, valid CRUD, strict fields/images/teachers, UUID replay, stale edits after bookings, deletion during multi-lesson confirmation, price changes, preserved enrolment and operational-auth export exclusions.
- Frontend tests cover lost admin responses/reload recovery, blocked storage, invalid success responses, memory-only tokens, explicit bearer headers and intersecting discovery filters. Full browser network-interruption recovery remains unclaimed.
- After the final recovery helper change, exercised the actual frontend API/client modules against the running isolated API: create, absolute edit, delete, public exclusion, restore and logout all passed. Verified the restored private operator configuration, server-side logout/rejection, twelve standard fixtures and mode-0600 credential files without printing credentials.

## Detailed lessons and teacher management extension

- Opened Coding Club from the catalogue into its dedicated hash route. Confirmed overview, three outcomes, age guidance, 75-minute duration, location, teacher profile and booking controls.
- Added a place from details, returned to the catalogue with the same basket, and completed checkout with fictitious Ava/007123456. Coding Club became four places and enrolment one; the basket cleared.
- Created Alex Morgan in Studio, assigned Coding Club, then edited the profile to add Art Workshop. Both public cards and the detail teaching team reflected the assignments. Explore lessons with Alex returned exactly those two lessons.
- Reloaded the direct lesson URL successfully. Inspected desktop details and the 375×667 header, hero, metadata and overview; the browser console showed zero messages. The initial native-browser walkthrough stopped before the lower detail controls and teacher editor were fully checked. The subsequent in-app browser pass below completes those responsive checks.
- Exercised actual frontend client modules against the isolated local HTTP API: teacher create/assign/delete/public exclusion/restore, lesson description/duration/outcomes editing, stock and confirmed enrolment preservation, and logout passed.
- Added HTTP denial checks for every teacher management route; local transaction tests cover teacher CRUD/replay/rollback, invalid records/fields, opposite-side stale edits, public deleted-profile exclusions, detail errors and non-destructive metadata backfill.
- A third isolated Atlas test covers a simultaneous teacher-side/lesson-side assignment race. It remains explicitly skipped without MONGODB_TEST_URI, alongside the two earlier native suites.
- Regenerated 37 Postman requests, including detail reads and teacher CRUD/replay/anonymous denial. JSON and every script parsed successfully; exported secrets remain blank. Actual execution in Postman remains pending.
- Stopped the isolated QA preview and restarted the normal port-8081 preview with the existing private operator configuration. Verified login, protected teachers access, logout/rejection, mode-0600 private credentials, twelve enriched lessons, four teachers and five initial places. The disposable QA data was reset, as indicated by the preview banner.

## Completed phone/tablet pass — 16 October 2026

The subsequent in-app Chromium browser could access localhost. Used a separate port-8082 preview with disposable process-only QA credentials and fixtures; the normal port-8081 data and private operator configuration were not changed. These are browser viewport checks, not physical iOS/Android device tests.

| Viewport | Evidence |
|---|---|
| 375×667 phone | Full lesson content and teacher profiles; add to capacity, disabled sold-out button, removal restoring a place, enrolment, basket switching, invalid contact rejection and leading-zero phone checkout. Teacher validation/focus, create/search/edit, two lesson assignments, delete/cancel/restore and logout passed. |
| 768×1024 tablet | Lesson overview/outcomes/profiles, saved shortlist, enrolment, teacher link filtering with an intact basket and a second successful checkout. Teacher profile editing, keyboard Space assignment toggles, delete/restore and confirmation dialog passed. |
| 320×568 small phone | Editor, assignments and long profile content fit; long-name dialog fits and scrolls within the available height. |
| 1024×768 landscape tablet | Lesson pages, teacher editor, assignment list, profiles, dialog and lesson library fit. |
| 1440×900 desktop | Long lesson detail content fits after the grid/wrapping repair. |

Fixes verified after reloading the revised files:

- Lesson titles/locations near their permitted limits could force the detail grid beyond the viewport. Added wrapping and zero-minimum grid tracks. Verified no horizontal overflow at 320, 375, 768, 1024 and 1440 widths with long topic, location, overview, outcome and teacher fields.
- Long lesson choices needed shrinkable fieldsets/text, and a long teacher name overflowed the delete dialog. Fixed assignment wrapping, dialog wrapping and related lesson-library/catalogue text. Teacher editor and lesson library document widths now equal each tested viewport. Dialog content width equals its inner width at 320/375/768/1024.
- Raised phone lesson reading text and responsive teacher biographies/assignment labels to 16px. Teacher inputs, textareas and search/status fields use 16px through tablet widths. The Studio home link now meets the 44px tap height; the inspected phone editor controls/assignment labels have no sub-44px targets.
- Invalid teacher submission focuses the first invalid field, bringing the inline message into view. Checked first/last-name errors, focus and keyboard order. Editor Cancel now keeps its word intact instead of shrinking and splitting on small screens.
- Confirmed two fictitious purchases: four Coding Club places and one Art Workshop place, with correct remaining stock and enrolment. Teacher edits/restores did not change either order or stock. No browser warning/error messages were captured in the final walkthrough.
- Reran all automated suites: 50 backend + 28 frontend tests passed, with the same three explicit native Atlas skips. No runtime dependencies were added.

Saved evidence: [phone editor](verification/screenshots/phone-teacher-editor.jpg), [phone lesson booking](verification/screenshots/phone-lesson-booking.jpg), [tablet lesson page](verification/screenshots/tablet-lesson-booking.jpg). Screenshots show disposable QA profiles/orders. The isolated preview was stopped after the checks; temporary viewport overrides and QA tabs were cleared.

## Remaining external and student checks

- Actual Atlas seed, ping and transaction write/rollback probe.
- Real Atlas integration/concurrency test.
- Hosted GitHub Pages → Render → Atlas flow, origin settings, cold-start and restart persistence.
- Import/run Postman requests and inspect Atlas records and Render logs.
- Export actual assessment collections; generate and extract the final ZIP.
- Student explanation review, demonstration rehearsal, booking and attendance.

The current extension has 78 passing local tests in total (50 backend and 28 frontend). Three native Atlas tests remain explicitly skipped. The original locked dependency clean install/audit passed earlier on this date; the extensions add no runtime dependencies. Final handover: backend 17 genuine milestone commits, frontend 16, with both working trees clean.

The initial sandbox could not bind localhost sockets; local tests passed after socket access was allowed. Earlier in-app browser access timed out, so native Chrome was used for the initial walkthrough. The subsequent responsive pass used the in-app browser successfully. No actual Atlas export, final ZIP, or hosted completion is claimed.

## Atlas/deployment setup in progress

Added a fail-closed explicit Atlas test command: missing credentials and unsafe assessment database targets return an error before test execution. Two new command tests pass; the backend suite is now 52 passing application/HTTP/command checks with the same three native Atlas skips. Added a read-only hosted checker; it correctly refuses absent real hosted links. Actual Atlas credentials, student-number service address and hosted verification remain pending. Backend now has 19 genuine commits; frontend has 16.

Atlas application-user creation was verified in Safari: readWrite@afterclass, restricted to live-apis. A separate afterclass-tests form is prepared with readWrite@afterclass_test and the same cluster restriction; password creation/submission remains with the user. The cluster resume was requested. No native Atlas pass or deployment is claimed while connection strings and required student number are absent.

## External setup follow-up — 16 October 2026

Atlas reported that the old live-apis M0 deployment cannot resume because its snapshot version is too old. No old cluster or data was deleted. Created a separate AfterClass Coursework project and a free AWS Mumbai afterclass cluster, with sample-data and automatic broad user setup disabled. The new project test user is verified as readWrite only on afterclass_test, restricted to the afterclass cluster. The application user hand-off and connection/network configuration are still pending.

GitHub CLI authorization succeeded as GantalaAvinash. Credential-pattern scanning across both repository histories found no matches; .env and .admin-local.txt remain excluded. Published backend main to the private repository https://github.com/GantalaAvinash/afterclass-backend with 19 genuine commits. Public frontend publication awaits explicit visibility approval. The user supplied student number 21j41a62f1 for the Render hostname. These are setup milestones, not evidence that native Atlas tests or hosted flows have passed.

Frontend publication was explicitly approved by the student. Published all 16 commits to public https://github.com/GantalaAvinash/afterclass-frontend and enabled main/root Pages. GitHub reports status built at https://gantalaavinash.github.io/afterclass-frontend/ with HTTPS enforced. Public API configuration and hosted behaviour remain pending. Both new-project Atlas users are now verified with separate readWrite database scopes. Atlas shows the current development IP active; expiry requires verification because the connection wizard was also used. Prepared URI templates from the actual Atlas driver connection screen in the ignored mode-0600 .env; private password insertion is pending. Render has an existing selected-repository GitHub installation; staged addition of only afterclass-backend, awaiting approval for the exact permissions shown before Save.

## Combined repository deployment preparation — 17 October 2026

The student authorized Atlas verification and deployment from after_class_simple_brainstrome. Added a Pages workflow that tests and publishes only frontend/, with official actions pinned to resolved commits. Enabled Pages in workflow mode at https://gantalaavinash.github.io/after_class_simple_brainstrome/. Prepared Render from the public repository with backend root, student-number service name, npm ci/npm start, free plan and /health. Actual Atlas connection attempts failed with MongoServerSelectionError/MongoNetworkError on both saved connection strings; network access investigation is pending Atlas re-authentication. No native database pass or live API completion is claimed.

## Native Atlas verification completed — 17 October 2026

After the current development IP rule became active, the Atlas ping and rolled-back transaction write passed. All three explicit native tests passed with zero skips: checkout rollback/last-place concurrency/idempotency/enrolment; duplicate admin creation/stale edits/history-preserving deletion; and opposite-side teacher assignment races. The earlier connection-only failures are retained as setup history rather than application assertion failures.

Non-destructive seed verification found 12 lessons with five spaces each, four teachers, valid lesson associations, populated description/learningOutcomes/ageGroup/durationMinutes fields, and zero assessment orders at this point. The regression suite passes 52 backend tests and 28 frontend tests; the three native database tests pass separately, for 83 checks total. Evidence: verification/atlas-native-2026-10-17.json.

Created the Free Singapore Render service afterclass-21j41a62f1 from the combined repository, root backend, npm ci/npm start, Node runtime, /health, and six production-only environment variables. Removed test/local values from the visible imported configuration before saving. The frontend production origin is now set to the actual service URL. Hosted behaviour and narrowed network access remain in progress.
