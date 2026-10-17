# AfterClass

A fictitious after-school lesson discovery and booking service for North London, with GBP prices, detailed programmes and protected lesson/teacher management. There are no real payments or customer accounts.

## Developer and student roles

The requester is a developer providing paid assistance to a separate student. The developer directed this work and completed the recorded setup/approval steps; OpenAI Codex generated or edited implementation, tests, design and documentation. Student authorship, direct contributions and independent review are not verified. See [AI_ACKNOWLEDGEMENT.md](AI_ACKNOWLEDGEMENT.md) for the full provenance record. The student should confirm permitted use and required disclosure with the module team.

Start with [STUDENT_HANDOVER.md](STUDENT_HANDOVER.md) for architecture, code traces, safe local exercises, troubleshooting and independent demonstration preparation. The guide does not mark student learning or rehearsal complete.

## Live application

- [AfterClass on GitHub Pages](https://gantalaavinash.github.io/after_class_simple_brainstrome/)
- [Render lesson API](https://afterclass-21j41a62f1.onrender.com/lessons)
- [Protected Studio](https://gantalaavinash.github.io/after_class_simple_brainstrome/admin.html)
- [Frontend coursework repository](https://github.com/GantalaAvinash/afterclass-frontend)
- [Backend coursework repository (private)](https://github.com/GantalaAvinash/afterclass-backend)
- [Deployment source](https://github.com/GantalaAvinash/after_class_simple_brainstrome)

Configured student number: **21j41a62f1**, supplied by the developer and requiring confirmation by the student. The two coursework repositories retain separate genuine development histories; both are synchronised with the submitted source.

Both hosted apps use this repository: Pages publishes `frontend/`; Render runs `backend/`. The original [frontend repository](https://github.com/GantalaAvinash/afterclass-frontend) and [private backend repository](https://github.com/GantalaAvinash/afterclass-backend) remain intact with their genuine coursework development histories, also preserved in this repository. Assessment access to the separate private repository must be arranged if required.

## Features

- Twelve seeded lessons and four public teachers; dedicated shareable lesson pages with outcomes, age guidance, duration and teaching profiles.
- All eight sorting combinations, backend text/numeric search, combined teacher filtering, saved shortlists and independent basket quantities.
- Validated checkout with leading-zero phone numbers, pending orders, absolute space updates, native MongoDB transactions, request-ID replay and reload recovery.
- Enrolment from confirmed purchased quantities, independent of later availability edits.
- Protected Studio with lesson CRUD, teacher profiles/assignments, soft deletion/restoration, revision checks, audit history and booking insights.
- Responsive phone/tablet layouts, keyboard controls, loading/error states, request logging, CORS and explicit missing-image errors.

## Structure and stack

`frontend/` uses pinned Vue 3.5.44 browser ESM, Options API, plain JavaScript/CSS and native promise-based fetch. There is no build step. `backend/` uses Node 24, Express 5.3.0 and the official MongoDB driver 7.7.0 with a locked dependency file. Atlas holds the assessment and separate test databases.

See the frontend/backend READMEs and `backend/docs/ADMIN_API.md` for implementation, validation and management API details. Vue and Lucide licences/attributions are included with the assets.

## Local use

Install backend dependencies, then use the explicitly labelled fixture preview:

```sh
cd backend
npm ci
npm run preview:test
```

Open http://127.0.0.1:8081. Fixture data is disposable and is not the assessment database. For real Atlas operation, copy `.env.example` to ignored `.env`, configure database-scoped credentials privately, then run `npm run check:atlas`, `npm run seed` and `npm start`. Serve `frontend/` separately and set its API origin to your local server for local integration. The committed production configuration points to Render.

Fresh private admin configuration can be generated with `npm run admin:setup`; follow the private credential handover instructions in the admin guide. Never commit `.env`, temporary passwords or session tokens.

## Verification

```sh
node --test frontend/test/*.test.mjs
cd backend
npm test
npm run test:atlas
npm run check:deployment
```

The explicit Atlas command requires `MONGODB_TEST_URI` and a separate database ending in `_test`; it refuses the assessment database. The ordinary backend command deliberately does not load `.env`, so native tests are skipped there and run separately.

Verified on 17 October 2026: 54 backend regression tests, 32 frontend tests and all three native Atlas tests passed (89 checks). Hosted read-only checks, all eight browser sorting combinations, combined filtering/basket stability, a permitted fictitious multi-lesson checkout, enrolment, admin sign-in/logout and teacher create/edit/assign/delete/restore checks passed. Hosted phone/tablet checks found no horizontal overflow or console warnings/errors. Actual evidence and remaining gates are recorded in `VERIFICATION.md` and `verification/`.

The approved live test order purchased two Coding Club places and one Art Workshop place, leaving three and four spaces respectively. Its test teacher is soft-deleted, leaving the four seed profiles public. These are genuine persisted verification records; availability was not silently reset.

## Deployment and submission

`.github/workflows/pages.yml` runs the frontend tests and publishes only the frontend folder using official actions pinned to commits. Render uses the Free Singapore service, backend root, `npm ci`, `npm start`, Node 24.x and `/health`. Production credentials are held only in Render environment settings; the test connection and plaintext admin password are excluded. Atlas allows Render’s verified outbound ranges 74.220.52.0/24 and 74.220.60.0/24 plus the retained development IP rules; 0.0.0.0/0 has been removed. A fresh Render restart, hosted checks and stock/enrolment comparisons passed with that restriction. Use Render’s Manual Deploy controls after backend changes and verify the resulting deployment.

`submission-links.json` contains the two coursework repository links and actual deployment URLs. The 37-request Postman collection passed 52 assertions through official Newman 6.2.3 against the separate real Atlas test database. Its 14 read-only hosted requests passed 23 assertions. Full collection mutations must run against test data. Actual Atlas snapshot exports contain all four assessment collections with checksums; operational authentication state is excluded.

See [SUBMISSION_GUIDE.md](SUBMISSION_GUIDE.md) for the ZIP contents, clean-install commands, data restoration, reproducible Postman checks, packaging and remaining student actions. Archive integrity and extracted-install verification are recorded in [VERIFICATION.md](VERIFICATION.md). Secrets, dependencies and Git internals are excluded.

The actual AI assistance and pending student explanation review are recorded in `AI_ACKNOWLEDGEMENT.md`. Do not describe generated assistance as independent student authorship. The assessed demonstration must follow the module’s prohibition on AI assistance.

Maintenance release: normal Safari public loading/admin sign-in verified; cart additions show a notification and View cart action, quantities are editable in the cart, and checkout accepts optional email. See the dated maintenance entry in VERIFICATION.md and STUDENT_HANDOVER.md.
