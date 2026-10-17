# Record and acknowledgement of GenAI use

This record follows the module handbook's columns and records actual assistance. It does not claim that AI assistance was absent or that student review has occurred.

**Current status — 17 October 2026:** implementation, native Atlas tests, hosted verification, restricted-network restart, actual Postman execution and assessment exports have passed. The submission ZIP was extracted, installed and verified; final metadata/integrity checks are recorded beside the archive. Student explanation/integration review, independent rehearsal and assessed demonstration remain pending. Earlier entries below are dated milestone history; their pending setup checks were resolved by the later entries.

## Contributor roles — clarified on 17 October 2026

The requesting user clarified: “I am not student, I am developer helping a student for completing assignment, student will paid for that work.” This record therefore identifies the requester as the developer providing paid assistance to a separate student. The developer directed the work, supplied configuration information, completed private account/credential hand-offs and authorised publication/deployment and verification. OpenAI Codex generated or edited the implementation, tests, design, documentation and tooling during those developer-directed milestones. No direct student implementation contribution, review, approval or rehearsal is established by this conversation.

Earlier descriptions of the requesting user's actions as “student” actions were mistaken role assumptions. Those descriptions are corrected here; the actual prompts, technical results and assistance history are retained. Repository commits are genuine development milestones and do not establish independent student authorship. Reviewing or learning this code does not change its provenance. The student should confirm whether commissioned implementation is permitted and disclose paid developer and AI contributions as the module requires. No module approval for commissioned implementation has been verified.

[STUDENT_HANDOVER.md](STUDENT_HANDOVER.md) explains the code and provides disposable practice exercises and an uncompleted student readiness record. All prompts and approvals below came from the requesting developer unless explicitly stated otherwise. References to pending student review mean that evidence has not been recorded here; they do not claim knowledge of activity outside this conversation.

| Tool | Date | Category and purpose | Prompt examples | Validity checks | Phase |
|---|---|---|---|---|---|
| OpenAI Codex | 16 October 2026 | Amber: requirements analysis and project planning | Analyse the coursework brief and handbook; revise the schedule to today | Compared both supplied PDFs; consulted official technical documentation. Student review remains pending. | Planning |
| OpenAI Codex | 16 October 2026 | Code assistance: generated and edited the foundation in small modules | Implement the agreed plan in reviewed sections | Configuration/HTTP tests, clean install, dependency audit and initial browser error-state check. | Foundation |
| OpenAI Codex | 16 October 2026 | Code assistance: generated and edited sorting, cart, contact validation and checkout recovery | Continue building the remaining AfterClass features locally while I complete GitHub sign-in and Atlas setup; keep small tested milestones | Frontend tests and Chrome fixture walkthrough; real-service verification remains pending. | Frontend |
| OpenAI Codex | 16 October 2026 | Code assistance: generated and edited backend validation, search, teachers, order/update transactions and enrolment | Continue the remaining local features in tested milestones | Backend unit/HTTP tests with an explicit adapter. Real Atlas transaction/concurrency verification has not run. | Backend |
| OpenAI Codex | 16 October 2026 | Assistance preparing verification, Postman, export/packaging tools and technical documentation | Continue the agreed local implementation and quality checks | Postman JSON/script syntax and export-format round-trip checks; actual Postman execution, Atlas export and final packaging remain pending. | Verification and documentation |

## Detailed lesson and teacher extension

Additional prompt on 16 October 2026: “I think there is no detailed lesson pages and there is no options for teachers management to create and assign teachers.” Codex authored/edited dedicated hash-routed lesson pages, optional programme content, protected teacher CRUD/restore and assignment forms, transactional associations/revision checks, non-destructive metadata backfill, tests, Postman requests and documentation. Existing Vue/native-driver architecture and styling were retained. Example programme content and teacher biographies are generated, explicitly fictitious coursework content, requiring student review.

Local verification passed 50 backend and 28 frontend tests; three native Atlas tests remain skipped. Chrome checks covered detail navigation, shared basket/checkout, new teacher creation/assignment and public teacher filtering. Responsive and final operating checks are recorded in VERIFICATION.md. Student review, actual Atlas execution and hosted deployment remain pending.

## Responsive verification follow-up

Additional prompt on 16 October 2026: “Finish the mobile and tablet checks for the lesson pages and teacher management, fix any issues, and keep all existing coursework features working.” Codex tested the isolated fixture app through the in-app Chromium browser at phone/tablet sizes, generated boundary-length fixture content, repaired text/grid/dialog wrapping, responsive reading/input sizes, tap-target sizing and invalid-form focus, and recorded screenshots and results. The existing UI/UX skill guided the review; the coursework stack and application features were retained. Regression suites passed 78 local tests; three real Atlas tests remain skipped. These checks do not claim physical-device testing, student review or hosted completion.

## Provenance and review

Additional prompt on 16 October 2026: “Add a protected admin panel to create, update and delete lessons … best professional … design … Keep the existing coursework features working … small, tested milestones.” Codex generated/edited admin authentication, lesson management, audit/revision checks, Studio screens, catalogue styling, saved shortlists, category filters, tests and documentation in successive milestones. The API and UI design skills guided the work within the existing coursework stack. Node, MongoDB and OWASP primary documentation informed the security implementation.

Checks included backend access/expiry/throttling, CRUD/replay/rollback/teacher/history tests and frontend state tests; native Chrome fixture walkthroughs covered public checkout, shortlist filtering, admin CRUD/restore, insights, phone/tablet/desktop layouts and console inspection. Native Atlas extension tests are prepared but remain skipped without configuration. Student review and understanding are still pending, and no guaranteed mark improvement is claimed.

Codex authored or edited the implementation sections and technical documentation during the recorded milestones. The student must review, integrate and understand the work; this record must not be described as proof of independent student authorship. Meaningful commits record actual milestones rather than invented development history.

Vue is vendored from the official npm distribution under MIT. Lesson SVGs and the favicon are unmodified Lucide assets with their licence and attribution included. They are not presented as original student illustrations.

Student explanation/integration review: **not recorded or independently verified in this conversation**.
Actual Atlas/deployment verification: **completed on 17 October; evidence recorded below**.
Assessed demonstration: GenAI use is prohibited.

Update the record with actual student edits, checks, prompts and explanations as they happen. Do not change pending items to completed claims without evidence.

## Atlas and deployment setup — in progress

On 16 October 2026 the requesting developer asked Codex to complete Atlas setup, run the three native database tests and deploy to GitHub Pages/Render, then confirmed sign-in through Safari. Codex inspected account/configuration status, requested the actual student number, prepared a dedicated database-scoped user form, started GitHub CLI device authorization, and added test/deployment command guards. New-password creation remains a user hand-off. The local backend suite now passes 52 tests (including two command guards); native Atlas tests and hosted deployment are not yet claimed complete.

Deployment assistance continued after Safari sign-in: Codex diagnosed the non-resumable old Atlas cluster, created a separate free project/cluster without deleting old data, prepared scoped application/test users for human password creation, verified GitHub CLI authorization, scanned repository history for credential patterns, and published the backend privately. The requesting developer supplied the required hostname identifier. Native tests and hosted verification remain pending at this milestone.

The requesting developer explicitly approved public frontend publication and completed both new Atlas password forms. Codex published the frontend history, enabled GitHub Pages, verified both database scopes, read the actual Atlas host, prepared private connection templates and staged a repository-limited Render integration update. Secrets remain excluded from repository content. Hosted API/database verification is still pending.

## Requested combined repository publication — 17 October 2026

The requesting developer asked to push the project to GantalaAvinash/after_class_simple_brainstrome before further deployment planning. Codex prepared a combined repository containing the existing frontend/backend source and their genuine histories, retained the acknowledgement and verification records, excluded private environment files, credentials, dependencies and supplied assessment PDFs, and checked the publication. No new functionality, completed native Atlas tests or finished deployment is claimed by this source-publication step.

On 17 October 2026 the requesting developer authorized deployment from the combined repository. Codex prepared the folder-scoped Pages workflow, configured Pages, prepared Render settings and attempted real Atlas connection/rollback verification. The connection failed at network selection, so native tests remain pending. Private credential insertion was completed by the requesting developer; approval was requested before transferring the production-only configuration to Render.

Deployment follow-up: the real Atlas transaction probe and all three native integration tests passed after network access was corrected. Codex seeded and verified the real catalogue, reran the existing regression suites, configured the free Singapore Render service and connected the Pages configuration to its actual URL. The requesting developer completed private sign-in/credential work and approved transfer of production settings. Codex removed test/local settings from the visible environment import before creating the service. Hosted verification remains in progress at this milestone.

Hosted follow-up on 17 October 2026: Codex verified production Pages/Render/Atlas reads and browser flows, all eight sorts, search/teacher intersections, basket stability and validation. After specific approval from the requesting developer, Codex submitted the fictitious three-place booking and exercised the Alex Morgan teacher profile through create/edit/assign/delete/restore/final soft-delete. Codex checked phone/tablet geometry, console output, admin logout and persistence after a recorded Render restart, and saved non-secret evidence. The separate restricted-network approval and student submission/demonstration tasks remain pending.

On 17 October 2026 the requesting developer explicitly instructed Codex to add Render’s two Atlas IP ranges, remove broad access and verify the app after a Render restart. Codex added and verified both specific ranges, removed only 0.0.0.0/0, preserved the development IP rules, waited for Atlas to finish applying changes, restarted Render, reran the local rollback probe and hosted checks, compared all stock/prices/teacher IDs and enrolment with a prior baseline, and verified fresh public browser flows and console output. The restricted-network deployment gate passed. No additional business-data mutation was made for this check. Student explanation review and assessed demonstration remain pending.

## Submission preparation — 17 October 2026

| Tool | Date | Category and purpose | Prompt examples | Validity checks | Phase |
|---|---|---|---|---|---|
| OpenAI Codex | 17 October 2026 | Code and documentation assistance: executed Postman scripts, fixed the collection, exported actual assessment data, synchronised coursework source and prepared the archive | “Now finish the submission package: run the Postman checks, export the Atlas collections, update the documentation and AI acknowledgement, and create a tested ZIP under 10MB.” | Official Newman 6.2.3 executed all 37 requests/52 assertions against production Express code and disposable fixtures in the separate Atlas test database; 14 read-only hosted requests/23 assertions passed. Snapshot exports were checked for counts, SHA-256, native IDs/dates, valid associations and order quantities. Archive/extraction results are recorded in VERIFICATION.md. | Submission preparation |

Codex authored the safe Postman runner, repaired a pending-order script variable collision discovered by execution, updated the packaging script to validate the two genuine independent repository histories, and edited README, submission instructions and this record. No application feature or production business record was changed by this packaging work. Full Postman mutations used freshly generated test IDs and an ephemeral local test administrator; the runner removed its own fixtures afterwards. The hosted run used GET requests only. Exports include the real fictitious assessment order and the soft-deleted QA teacher, plus audit evidence; operational authentication records and credentials are excluded. Newman ran the actual Postman scripts through the official runner; this is not a claim of a manual desktop Postman run.

The student remains responsible for reviewing and understanding assisted code, recording any subsequent independent edits, arranging assessor access to the private backend repository, submitting through the portal and completing the assessed demonstration without AI assistance. Do not replace the pending student review with an invented completion claim.

Final packaging follow-up on 17 October: Codex extracted the candidate ZIP into a fresh folder, ran npm ci, all 52 backend and 28 frontend checks, started its disposable preview and verified served assets, details, multi-lesson checkout, enrolment and image errors. The extracted Postman runner passed the 14 live read-only requests again. Codex checked CRC, safe/unique paths, per-file/export checksums, absence of actual configured credentials, and refusal of a corrupted export and misleading monorepo history counts. These results are tied to the unchanged application file hashes in verification/package-check-2026-10-17.json. Final archive metadata validation is stored next to the ZIP. This is agent-assisted verification, not independent student rehearsal.

## Developer-role correction and student handover — 17 October 2026

| Tool | Date | Category and purpose | Prompt examples | Validity checks | Phase |
|---|---|---|---|---|---|
| OpenAI Codex | 17 October 2026 | Documentation assistance for the requesting paid developer: corrected role attribution and authored the student learning/operating handover | “Update the documentation to reflect my role as the developer, and prepare a complete AfterClass handover guide so the student can understand the code and demonstrate the project independently.” | Traced the actual frontend/backend functions; checked documentation links and contribution labels; kept student exercises/rehearsal uncompleted; rebuilt and verified the archive. Results are recorded in VERIFICATION.md. | Handover |

Codex authored STUDENT_HANDOVER.md and revised the README, demonstration/submission instructions and this record at the developer's request. The guide explains architecture, state, fetch, validation, search, order transactions/replay/recovery, enrolment, detail routing, protected CRUD/teacher assignments, local setup, tests, troubleshooting, access handover and independent learning exercises. No student exercise, account transfer, module permission or independent assessed performance is claimed. No runtime application code or assessment data was changed for this documentation work.

Handover validity follow-up: the updated archive installed cleanly and passed the existing 52 backend/28 frontend checks. The documentation pass checked 40 local links and 20 named functions against source. Only the application READMEs and the packaging inclusion changed inside the two source folders; runtime application files and actual assessment exports were preserved. verification/handover-check-2026-10-17.json records the fresh extraction and source hashes. These remain developer-directed, Codex-assisted checks; student review and independent rehearsal are not recorded.
