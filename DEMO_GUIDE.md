# AfterClass — independent demonstration preparation

This guide was prepared with Codex for the developer providing paid assistance to a separate student. It does not establish student authorship, understanding or completed rehearsal. Read [STUDENT_HANDOVER.md](STUDENT_HANDOVER.md) and [AI_ACKNOWLEDGEMENT.md](AI_ACKNOWLEDGEMENT.md), confirm permitted commissioned assistance/disclosure with the module team, and describe contributions accurately.

Use these materials during preparation. The handbook prohibits GenAI during the assessed demonstration; follow its rules on permitted materials and assistance. Rehearse without AI or developer prompting once you have learned the code. Do not mark a rehearsal complete until the student actually performs it.

## Prepare a practice environment

Use an extracted copy and the disposable preview on a separate port, or an authorised separate Atlas test database. The handover guide provides setup instructions. Use fictitious contact details. Full Postman collection runs change stock and profiles; keep them on test data. A local fixture rehearsal cannot replace the required hosted assessed demonstration.

For the hosted session, verify the student identifier, repository/cloud access and current stock. Open the GitHub Pages app, Render logs, Atlas, frontend/backend source and selected Postman requests. Warm /health. Keep private environment files/passwords/bearer headers off the screen. Select any live demonstration mutation deliberately and retain its explainable history; do not reset sold stock for appearance.

## Ten-minute independent rehearsal

| Time | Show | Explain and locate |
|---|---|---|
| 0:00–2:00 | Catalogue, sorting in both directions, add/remove, basket and validation | v-for/v-on/v-model, computed values, state.mjs numeric comparisons and independent cart |
| 2:00–4:00 | One fictitious multi-lesson practice checkout; selected GET/POST/absolute PUT examples | checkout.mjs persisted UUID, orders.js pending record, updates.js transactional confirmation |
| 4:00–5:00 | Practice order/stock in the database and a matching request log | Native ObjectIds, expected/target spaces, confirmed status; timestamp/method/URL/status/duration |
| 5:00–7:00 | Literal text/numeric search plus teacher filter, detail page and enrolment | catalogue.js backend search/associations, lesson-route.mjs, enrolment.js confirmed quantities |
| 7:00–10:00 | Trace a request and explain or make one small practice change | Relevant callers, validation, error path, tests and actual developer/AI/student contributions |

Fit the required criteria first. If time allows, show Studio teacher creation/assignment and lesson detail content using practice records. Explain memory-only bearer access, server permissions, revisions, UUID retry, soft deletion and relationship ownership in teacher.lessonIds. Delete/restore preserves purchase history. Studio/design extensions have no guaranteed extra marks.

## Explain without reading a prepared answer

1. Trace a catalogue request from mounted() through fetch, middleware, route and database response to v-for.
2. Show why sorting £9/£100 uses subtraction and how displayed spaces subtract basket quantity.
3. Explain how filtering can hide a lesson without removing it from the basket.
4. Locate browser and server name/phone validation, and explain the phone's string type.
5. Follow one checkout UUID across POST, confirmation PUT, a lost response and a reload.
6. Identify every write in the transaction and what aborts the whole multi-lesson purchase.
7. Explain why a replay cannot deduct stock again and why changing details with the same UUID is rejected.
8. Show where search runs and how teacher.lessonIds restricts results.
9. Explain why pending orders and space edits do not determine enrolment.
10. Show how a detail fragment works on static Pages hosting and how stale requests are cancelled.
11. Distinguish CORS from admin authorisation, and locate session expiry checks.
12. Explain why teacher assignments have one stored owner and why both editor sides use revisions.
13. Distinguish adapter tests, actual Atlas tests, hosted checks and independent student understanding.
14. Describe your actual personal work and the external developer/AI contributions accurately.

Use STUDENT_HANDOVER.md for learning points and exercises before trying these independently. If an answer is uncertain, inspect the code and practise again; do not invent an explanation or an authorship claim.

## Small local changes to practise

Choose a form message or default sort direction. Predict the effect, locate the function/template, make the edit on a practice branch/copy, run the relevant frontend tests and explain the diff. Separately practise teacher assignment and an absolute spaces/price PUT on test data. Show why an old Studio revision conflicts after a booking.

Do not change production configuration or reset live orders merely for a rehearsal. Save genuine independent student changes with an accurate description and update the contribution record.

## Student rehearsal record

| Item | Student evidence |
|---|---|
| Date and actual duration | Not recorded |
| Environment/data used | Not recorded |
| Completed without AI or developer prompting | Not recorded |
| Request/function trace explained independently | Not recorded |
| Small change explained and verified | Not recorded |
| Questions needing more study | Not recorded |
| Permitted assistance/disclosure and identifier verified | Not recorded |
| Demonstration booked/attended | Not recorded |

Automated passes and developer/Codex walkthroughs are technical evidence. They do not fill this student record or constitute an assessed demonstration.

## Cart and email update — 17 October 2026

Show the visible added notification, the persistent selected-place note and the lesson's View cart action. Increase/decrease quantities in the cart; explain the capacity limit and removal of the last line. Email is optional, validated on browser/server and saved with the order; no message is sent. Old pending checkouts without email still recover with their original request IDs. Use disposable preview/test data for practice purchases, not assessment stock.

For the normal-Safari checks, reload the public catalogue and sign in to Studio after warming the API. API reads bypass caches and retry a transport failure once within a total 90-second budget. Login and checkout submissions do not automatically replay. An intermittent browser connection cause was observed but not conclusively identified; do not claim a hosting upgrade or privacy-setting change was necessary.
