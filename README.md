<!-- Combined source repository: after_class_simple_brainstrome -->
# AfterClass — CST3144

The local application now covers the core features and all three challenges. Real Atlas verification, hosted deployments, final exports, and student explanation review remain pending.

## Open the local test preview

From the backend folder, run:

~~~sh
npm run preview:test
~~~

Open http://127.0.0.1:8081. This explicitly labelled preview uses in-memory test fixtures, not Atlas, and resets when restarted. Production startup never falls back to fixtures.

For the actual Atlas-backed application, configure the ignored backend/.env file, run npm run seed and npm run check:atlas, start npm start in backend, and serve frontend on port 8080. See the application READMEs.

## Delivered locally

- Twelve seeded lessons, five initial spaces each, images, four teachers, and Vue v-for rendering.
- Four sort fields in both directions; quantity-aware availability; guarded add/remove actions; basket view and total.
- JavaScript contact validation; order POST followed by absolute-space PUT; transactional confirmation, conflict handling and duplicate-safe retries.
- Server-side search across topic, location, price and spaces; teacher selection; enrolment from confirmed purchased quantities.
- Request logging, restricted browser origins, static-image middleware, explicit errors, graceful server shutdown and locked dependencies.
- A pinned local Vue runtime, responsive layouts, keyboard focus, accessible labels/errors, and a labelled fixture preview.
- Protected AfterClass Studio: server-checked sign-in, lesson creation/editing/deletion/restoration, teacher assignment, revisions, retry recovery and transactional audit history.
- Booking insights with confirmed quantities, GBP booking value and low-stock indicators; public saved shortlists and category filters.
- Shareable lesson detail pages with editable overview, outcomes, age guidance and duration, teaching profiles, basket controls and live availability.
- Teaching team management: create/edit profiles, assign multiple lessons, search, soft-delete/restore and audit changes with revision protection.
- Richer editorial catalogue and Studio layouts for desktop, tablet and phone, preserving the original stack.
- Thirty-seven importable Postman requests, a real-Atlas export command, a guarded submission packager, and a demonstration guide.

Studio opens at http://127.0.0.1:8081/admin.html in the fixture preview. Local admin credentials were generated privately in ignored backend/.admin-local.txt. Save them in your password manager and remove that temporary file. Production keeps only the salted password hash in environment settings. See backend/docs/ADMIN_API.md for setup, rotation and API examples. This extension does not replace assessment criteria or guarantee additional marks.

Each code folder is an independent Git repository. See VERIFICATION.md for actual test results and the acknowledgement record for actual assistance. Student review has not been claimed as complete.

## Required final links

| Link | Status |
|---|---|
| Frontend repository | [GantalaAvinash/afterclass-frontend](https://github.com/GantalaAvinash/afterclass-frontend) — public |
| GitHub Pages | [Pages address](https://gantalaavinash.github.io/afterclass-frontend/) enabled; API configuration and hosted verification pending |
| Backend repository | [GantalaAvinash/afterclass-backend](https://github.com/GantalaAvinash/afterclass-backend) — private; assessment access must be arranged |
| Render /lessons | Student number received; pending Atlas connection and deployment |

Once the hosted application is verified, copy submission-links.example.json to submission-links.json and enter the four actual URLs and student number. Do not invent or submit placeholder links.

## Assessment evidence map

| Criterion | Local implementation and evidence |
|---|---|
| Lesson display (7%) | Seed data, SVG middleware, catalogue cards, v-for |
| Sorting (8%) | state.mjs; all eight combinations tested, including 9 versus 100 |
| Add/cart (10%) | Independent quantities, visible disabled buttons, removal restoration, view switching; unit and browser checks |
| Checkout (6%) | JS regex validation, visible disabled button, confirmed-only success message; browser walkthrough |
| Database (8%) | Native-driver lesson/order/teacher schema and non-destructive seeding; actual Atlas execution pending |
| Middleware (8%) | Logger, CORS and image middleware; HTTP tests and observed preview logs |
| REST API (7%) and fetch (6%) | GET/POST/absolute PUT; full local HTTP flow and browser submission |
| Search (6%) | Server search across four fields, numeric and literal matching |
| Teachers (8%) | Four teacher records, multiple lessons each, intersected filters |
| Enrolment (6%) | Confirmed quantity sums independent of availability edits |
| Demonstration (20%) | DEMO_GUIDE.md and prepared Postman requests; student rehearsal and booking pending |

## Final package

After actual Atlas tests and hosted smoke tests pass, review the acknowledgement, run npm run export:atlas in backend, and run npm run package:submission there. The packager requires real links, collection exports with matching checksums, clean repositories, and at least ten commits in each repository. It excludes dependencies, repository internals and the real .env file, and checks the ZIP size and integrity.

No final ZIP or actual Atlas export has been produced yet. The assessed demonstration must still be booked and attended within the module's scheduled weeks.

## Combined source repository

This repository contains the AfterClass frontend in `frontend/` and API in `backend/`, with their existing development histories preserved. The original two coursework repositories remain separate. Source publication is verified. Deployment is being configured from this combined repository. Real database connections, native Atlas checks and hosted API verification remain pending; see VERIFICATION.md.

Repository: https://github.com/GantalaAvinash/after_class_simple_brainstrome

## Deployment from this repository

GitHub Pages publishes only `frontend/` through `.github/workflows/pages.yml`, with frontend regression tests before publishing. Pages is configured at https://gantalaavinash.github.io/after_class_simple_brainstrome/. The public API origin in `frontend/config.js` must match the verified Render service before the app is operational.

Render uses this repository with root directory `backend`, build `npm ci`, start `npm start`, Node 24.x, the Free compute plan and health path `/health`. Secrets are entered only in Render environment settings. Native Atlas tests and hosted verification are still pending at this setup milestone.

## Current combined-repository deployment

- Source: https://github.com/GantalaAvinash/after_class_simple_brainstrome
- Frontend: https://gantalaavinash.github.io/after_class_simple_brainstrome/
- API lessons: https://afterclass-21j41a62f1.onrender.com/lessons

The service is configured from this combined repository. Hosted verification is in progress; see the root VERIFICATION.md. The original frontend/backend repositories remain available separately for coursework history.
