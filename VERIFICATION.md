# Verification log — 16–17 October 2026

## Contributor clarification — 17 October 2026

The requesting user is a developer providing paid assistance to a separate student. Requests, setup hand-offs and approvals previously attributed to “the student” came from that developer; those labels have been corrected while retaining technical history. Codex generated/edited the implementation and verification materials under the developer's direction. These technical checks do not establish student authorship or understanding. The student's direct contributions, module permission for commissioned implementation, independent review and rehearsal are not verified here. See AI_ACKNOWLEDGEMENT.md and STUDENT_HANDOVER.md.

## Current result — 17 October 2026

89 application checks have passed: 54 backend, 32 frontend and three native Atlas tests. Official Postman runner Newman 6.2.3 passed all 37 collection requests/52 assertions against the real separate Atlas test database, and 14 hosted read-only requests/23 assertions. Actual assessment exports contain lesson (12), teacher (5, including one soft-deleted QA profile), order (1) and adminAudit (5). Archive verification is recorded in the final submission entry below. Student review, independent rehearsal, portal submission/access and assessed demonstration remain pending. The earlier entries are preserved milestone history, not the current completion state.

## Automated local checks

| Check | Evidence |
|---|---|
| Backend suite | 54 application/HTTP tests passed; 3 real-Atlas cases deliberately skipped in the ordinary run and passed in the explicit separate run |
| Frontend suite | 32 tests passed across coursework state, admin/recovery, discovery, details, teachers and actual Vue template compilation |
| Postman artifact | 37 requests / 52 assertions executed successfully by official Newman against isolated Atlas test fixtures |
| Export format | Actual Atlas Extended JSON exports of all four assessment collections have checked counts and SHA-256 checksums |
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

GitHub CLI authorization succeeded as GantalaAvinash. Credential-pattern scanning across both repository histories found no matches; .env and .admin-local.txt remain excluded. Published backend main to the private repository https://github.com/GantalaAvinash/afterclass-backend with 19 genuine commits. Public frontend publication awaits explicit visibility approval. The requesting developer supplied the configured student number 21j41a62f1 for the Render hostname. These are setup milestones, not evidence that native Atlas tests or hosted flows have passed.

Frontend publication was explicitly approved by the requesting developer. Published all 16 commits to public https://github.com/GantalaAvinash/afterclass-frontend and enabled main/root Pages. GitHub reports status built at https://gantalaavinash.github.io/afterclass-frontend/ with HTTPS enforced. Public API configuration and hosted behaviour remain pending. Both new-project Atlas users are now verified with separate readWrite database scopes. Atlas shows the current development IP active; expiry requires verification because the connection wizard was also used. Prepared URI templates from the actual Atlas driver connection screen in the ignored mode-0600 .env; private password insertion is pending. Render has an existing selected-repository GitHub installation; staged addition of only afterclass-backend, awaiting approval for the exact permissions shown before Save.

## Combined repository deployment preparation — 17 October 2026

The requesting developer authorized Atlas verification and deployment from after_class_simple_brainstrome. Added a Pages workflow that tests and publishes only frontend/, with official actions pinned to resolved commits. Enabled Pages in workflow mode at https://gantalaavinash.github.io/after_class_simple_brainstrome/. Prepared Render from the public repository with backend root, student-number service name, npm ci/npm start, free plan and /health. Actual Atlas connection attempts failed with MongoServerSelectionError/MongoNetworkError on both saved connection strings; network access investigation is pending Atlas re-authentication. No native database pass or live API completion is claimed.

## Native Atlas verification completed — 17 October 2026

After the current development IP rule became active, the Atlas ping and rolled-back transaction write passed. All three explicit native tests passed with zero skips: checkout rollback/last-place concurrency/idempotency/enrolment; duplicate admin creation/stale edits/history-preserving deletion; and opposite-side teacher assignment races. The earlier connection-only failures are retained as setup history rather than application assertion failures.

Non-destructive seed verification found 12 lessons with five spaces each, four teachers, valid lesson associations, populated description/learningOutcomes/ageGroup/durationMinutes fields, and zero assessment orders at this point. The regression suite passes 52 backend tests and 28 frontend tests; the three native database tests pass separately, for 83 checks total. Evidence: verification/atlas-native-2026-10-17.json.

Created the Free Singapore Render service afterclass-21j41a62f1 from the combined repository, root backend, npm ci/npm start, Node runtime, /health, and six production-only environment variables. Removed test/local values from the visible imported configuration before saving. The frontend production origin is now set to the actual service URL. Hosted behaviour and narrowed network access remain in progress.

## Hosted verification completed — 17 October 2026

Pages workflow cffa534 succeeded and serves the production API origin. Hosted read-only checks passed for Pages assets, Render database health, catalogue, lesson details, teacher associations, enrolment, SVGs/missing-image errors, matching CORS and anonymous admin denial.

Browser checks passed for all eight field/direction sorts (including £9 and £100), numeric search 100 intersected with Leo Grant, preserved basket quantities across detail/catalogue/filter switching, invalid name/phone rejection and a leading-zero phone checkout. With explicit approval from the requesting developer, Ava/007123456 purchased two Coding Club places and one Art Workshop place in one confirmed order, reference 6ad2fd4ea6d150d1d282b801. The basket cleared; resulting spaces are three/four and enrolment two/one. No payment was made.

Hosted Studio sign-in/protected reads/logout passed. With permission, created Alex Morgan, assigned Coding Club and Art Workshop, edited the biography, verified public profiles and the exact two-lesson teacher filter, soft-deleted, restored and finally soft-deleted the QA profile. Four seeded teachers remain public. Insights still show twelve active lessons, 57 spaces, three purchased places and £70 fictitious booking value. Audit history records the five teacher actions. Stock and purchase history were preserved.

Hosted lesson/detail checks at 375×667 and 768×1024, plus the teacher editor at those widths, had matching document/body/viewport widths. Public and Studio console warn/error lists were empty. The operator signed out after checks; temporary viewport overrides were reset. Saved screenshots under verification/screenshots/. Earlier local checks provide the fuller responsive boundary-content and keyboard evidence.

Render Events confirms a service restart on 17 October. Subsequent fresh API reads preserved both purchased quantities/remaining spaces and the four public teachers. The temporary production credential import file was removed. The private .env and operator credential file remain excluded from Git. Evidence is in verification/hosted-checks-2026-10-17.json.

The restricted-network deployment gate subsequently passed; see the final access-list/restart verification below. Manual Postman execution, final exports/ZIP, student explanation review and assessed demonstration remain separate submission tasks.

The hosted walkthrough also exposed the label “1 confirmed orders”. Changed it to “Confirmed orders: 1” (and the equivalent for any count); reran all 28 frontend/template compilation checks successfully. No application state or API behaviour changed.

## Restricted Atlas access and fresh Render restart — 17 October 2026

The requesting developer explicitly authorized adding Render’s two outbound ranges, removing broad access and verifying AfterClass after restarting Render. Added 74.220.52.0/24 and 74.220.60.0/24, verified both Active, then deleted only 0.0.0.0/0. The two existing development /32 rules were retained. Waited until Atlas no longer reported changes being deployed before restarting Render, so the new API process established its database connection under the restricted rules. No development addresses or credentials are included in the published evidence.

Render Events records the new service restart at 10:34am IST. The local Atlas ping and transaction-write/rollback probe passed with broad access removed. The full hosted read-only checker passed again: Pages assets and correct API configuration; Render database health; catalogue, details, teachers and enrolment; SVG and missing-image handling; CORS; and anonymous admin denial.

Compared all twelve lesson IDs, spaces and prices, all four public teacher IDs and the two purchased-quantity totals with a baseline captured before the restart. They matched exactly: Coding Club still has three spaces and two purchased, Art Workshop four spaces and one purchased. A fresh live browser reload, mixed-case cOdInG search combined with Leo Grant, detail page and purchased-quantity display passed. The console warn/error list was empty. No new order or teacher record was created during this network verification.

Saved verification/network-restart-2026-10-17.json and verification/screenshots/restricted-network-live-lesson.jpg. The Atlas network restriction and post-restart deployment gates are now complete. Manual Postman execution, final exports/ZIP and student demonstration preparation remain separate submission work.

## Actual Postman execution and Atlas exports — 17 October 2026

Executed the exported v2.1 Postman collection with the official Newman 6.2.3 runner, using the current Express application and real afterclass_test Atlas database. The full run uses 12 newly generated lesson IDs, four teacher IDs and ephemeral test administrator credentials. It never targets the assessment database, never drops a database, and removes only its own created fixtures. The separate hosted mode permits only public GET requests and the two anonymous admin-denial GET requests.

The first complete execution found a Postman sandbox SyntaxError: the pending-order script declared a reserved global name, data. It prevented storing orderId/updates, causing downstream confirmation/replay assertions to fail. Renamed it pendingResponse in the generator and regenerated the exported collection. Rerun: 37 requests, 52 assertions, zero failures. This was a collection script defect; no application route change was needed. Hosted run: 14 requests, 23 assertions, zero failures. Newman emits a dependency deprecation warning under Node 24; it does not affect assertions or the running application. No desktop GUI Postman run is claimed. Sanitised reports are in verification/postman-atlas-test-2026-10-17.json and verification/postman-hosted-read-only-2026-10-17.json.

Exported actual afterclass assessment data through a native snapshot transaction: 12 lessons, five teachers (four active plus the soft-deleted Alex Morgan verification profile), one confirmed Ava order and five teacher-management audit events. Strict MongoDB Extended JSON preserves ObjectIds, numeric types and dates. Checked each manifest SHA-256/count, IDs/dates, lesson content/availability, every teacher/order lesson reference and order space/quantity calculations. Confirmed history still records Coding Club quantity two and Art Workshop quantity one; available places total 57. adminSession/adminLoginAttempt are intentionally excluded as operational authentication state. Export metadata and independent validation are recorded in verification/atlas-export-2026-10-17.json; actual export files remain local and are included in the submission ZIP.

## Submission archive verification — 17 October 2026

Synchronised the delivered frontend/backend source into the two independent coursework repositories and published genuine milestones. Frontend has 17 commits; backend has 20. The package verifies each actual Git root, clean tree, remote URL and source-file equality with the combined deployment checkout. It does not count the combined repository's imported history as two independent histories. PACKAGE_MANIFEST.json includes exact repository commits and SHA-256 for every packaged file. The latest Pages workflow after source/documentation synchronisation passed: run 39006084079. No production API behaviour changed.

Built the candidate ZIP below the strict 10,000,000-byte limit, checked CRC and every archived byte, extracted it to a fresh temporary folder and independently verified safe unique paths, per-file/export checksums and the exclusion of Git, dependencies, environments, private credentials and operational auth collections. Scanned the decompressed entries for the actual privately configured connection strings, encoded/decoded database passwords, admin hash and operator password; none was present. A deliberately corrupted export checksum was refused without replacing the existing valid ZIP. Default invocation in the monorepo was correctly refused as evidence of separate repository histories.

From the extracted archive, npm ci installed 77 locked packages successfully; 52 backend and 28 frontend checks passed with zero failures. The three native tests were explicitly skipped in this credential-free extracted run; their separate real Atlas passes remain in the native evidence. Started the archive's fixture preview on a separate temporary port and passed frontend/Studio assets, fixture configuration, twelve lessons/four teachers, lesson details, image delivery, multi-lesson confirmation, enrolment and missing-image 404. Stopped that preview afterwards, preserving the user's existing local preview. The extracted actual Postman collection passed all 14 read-only hosted requests/23 assertions again.

verification/package-check-2026-10-17.json records these results and the exact unchanged application file hashes. The final ZIP incorporates this evidence and the updated documentation; its final CRC/path/checksum/size/credential scan and SHA-256 are recorded under output/ beside the archive. No dependencies or credentials are added by packaging. Actual Atlas export files and the ZIP remain local rather than being published to GitHub.

Package preparation is complete. Student explanation/integration review, independent demonstration rehearsal, assessor access to the private backend, submission portal upload/deadline-timezone verification, and demonstration booking/attendance remain student actions. No portal submission or independent rehearsal is claimed.

## Developer-to-student handover — 17 October 2026

Corrected the requesting user's role to the developer providing paid assistance, including historical setup/publication/live-verification approvals. Added STUDENT_HANDOVER.md with actual source links and function traces, architecture/checkout diagrams, data/relationship ownership, practice-copy setup, observable exercises, explanation prompts, troubleshooting and an uncompleted readiness record. Updated demonstration/submission guidance and both application READMEs to identify external developer/AI assistance. The configured student identifier is retained as supplied by the developer and explicitly requires student verification; no identity or access transfer is assumed.

Handover changes are documentation plus a packaging inclusion change. Existing runtime source and assessment exports are preserved. The updated ZIP includes the handover, acknowledgement and supporting records; final archive validation is saved beside it. Independent student exercises/rehearsal, permitted-use confirmation, account access, portal upload and demonstration remain unverified student/developer handover actions.

Handover archive checks passed from a fresh extraction: locked npm ci installation, 52 backend and 28 frontend checks, zero failures (the three native suites explicitly skipped without credentials in this extracted run). All 40 local documentation links resolved; 20 named implementation functions were checked against source. Contributor labels identify paid developer/AI assistance, and student readiness remains uncompleted. Compared with the prior verified archive, changes inside frontend/backend are limited to the two READMEs and the packager's handover inclusion; application runtime files are byte-identical. Current source hashes and exact independent repository versions are recorded in verification/handover-check-2026-10-17.json. Final ZIP size, CRC, per-file/export checksums and actual-credential exclusion are recorded in output/package-validation.json beside the archive.

## Safari/cart/email maintenance — 17 October 2026

Local regression: **32 frontend + 54 backend tests passed**. The ordinary backend run deliberately skips the three credential-gated Atlas cases; a separate native run executed **all three against afterclass_test, with zero skips/failures**. The exported Postman collection, now including optional email in checkout, passed **37 requests / 52 assertions** against isolated real Atlas test fixtures; its runner cleaned only those fixtures.

Browser checks on disposable preview 8086: visible added notification and View cart state, increase to five/disabled plus, decrease restoring capacity, valid/invalid optional email, leading-zero phone, one successful checkout, teacher/search preserving a hidden basket line, detail-page shared cart, last-line removal returning to catalogue, disabled empty basket, no browser error logs. At 375×812 and 768×1024 the cart had no horizontal overflow; quantity controls measured 44×44 pixels. Normal Safari also loaded the preview and passed add/View cart/increase checks. Live deployment verification follows in the dated maintenance evidence.

API JSON responses use no-store. Browser reads use cache bypass and one transport-only GET retry within the existing 90-second total budget. Mutation retry identities, transaction boundaries, password hashing and browser security settings are retained. The earlier normal-Safari stall happened without HTTP response headers while direct probes and private Safari worked; its exact browser transport cause was not conclusively established.

Live maintenance verification: Render deployed backend commit ae9b182 successfully (deploy dep-db9m46e1egvs73fpmos0); Pages workflow 39030594834 completed successfully for f6e104f. API health/catalogue/teachers returned 200, no-store and the correct Pages CORS origin. Post-deploy catalogue/teacher probes took 168/182 ms after health warm-up; these are direct probes, not a Safari sign-in benchmark. Hosted Postman passed 14 requests / 23 assertions, and the existing deployment checker passed.

In **normal Safari**, the live public page loaded all twelve lessons/teacher associations; adding Art Workshop displayed the notification and View cart action. The cart showed the email field; plus/minus changed one/two places and £20/£40 totals. A fresh Studio sign-in succeeded with existing credentials and loaded twelve lessons, four teacher profiles/assignments and overview values of 57 available places, three purchased places and £70 from one confirmed order. Safari offered to save the password; this was dismissed without saving. Browser verification ended when the developer navigated elsewhere; no sign-out rerun is claimed. No live order, lesson or teacher was changed. The refreshed in-app public page also loaded 12 lessons/four teachers with no captured console errors.

Screenshots are saved locally under output/diagnostics/safari-live-cart-feedback.png, safari-live-cart-email.png and safari-live-admin.png. User browser data and privacy/security settings were not cleared or weakened. The original normal-Safari intermittent transport cause remains unconfirmed; the release adds bounded recovery and passed these live checks, without claiming that every future network failure is eliminated.

The refreshed cart/email package passed clean locked installation from a fresh extraction: 54 backend and 32 frontend checks, zero failures, with the same three explicit native skips in that credential-free extraction. Its application files match the separately Atlas-tested workspace exactly. verification/cart-package-check-2026-10-17.json records source hashes and these checks; final ZIP metadata, CRC/checksums, credential exclusion and SHA-256 are recorded beside the archive in output/. The existing PDF remains its explicitly dated earlier source snapshot.
