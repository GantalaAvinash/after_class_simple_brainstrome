# AfterClass demonstration preparation

Use this for preparation before the assessed session. Do not use GenAI during that session. The student still needs to rehearse, book and attend their own demonstration.

## Before the session

Open the actual GitHub Pages app, Render logs, Atlas database, both source repositories in the editor, and the imported Postman collection. Warm the Render service. Use fictitious contact details. Verify current stock and avoid resetting real purchase history while practising.

The local fixture preview is for development and cannot replace the required hosted demonstration.

For the optional Studio extension, sign in before the rehearsal, then show a small create/edit/delete/restore cycle with a fictitious lesson. Explain that authorisation is checked by Express, the password is hashed, the browser token is temporary, and deletion keeps confirmed purchase history. Show an edit conflict after a booking and identify the revision check. Open a lesson detail page, create a fictitious teacher in Teaching team, assign that lesson, and verify the public profile/filter. Explain why teacher-side and lesson-side assignments share one relationship and invalidate stale forms. Show teacher membership and booking insights without exposing customer details. Prioritise assessed features within ten minutes; this extension has no promised extra marks.

## Ten-minute rehearsal

| Time | Show and explain |
|---|---|
| 0:00–2:00 | Catalogue, subject/location/price/space sorting in both directions, basket addition/removal, disabled sold-out state and validation |
| 2:00–4:00 | Submit an order; show Postman GET, POST and absolute PUT, including another editable attribute |
| 4:00–5:00 | Locate the order and changed spaces in Atlas; explain method, URL, status and duration in a matching Render log |
| 5:00–7:00 | Numeric/text search, teacher selection, enrolment and the related frontend/backend code |
| 7:00–10:00 | Answer short code questions and trace one complete request or small edit |

## Questions to practise in your own words

1. How do v-for, v-on, v-model, computed state and mounted contribute to this app?
2. Why are cart quantities separate from stored spaces?
3. Why do numeric fields need numeric sorting?
4. How does fetch differ from receiving a successful HTTP response, and why check response.ok?
5. What does each middleware do, and why is logging first?
6. Why does a CORS origin omit the GitHub repository path?
7. How are string IDs validated and converted to MongoDB ObjectIds?
8. Why does POST save a pending order and PUT confirm it?
9. How do the transaction, compare-and-set condition and request ID prevent partial or duplicate purchases?
10. Why must transaction operations be sequential?
11. Where does search execute, and how are price and space searched?
12. How does a teacher's lesson association restrict results?
13. Why is enrolment calculated from confirmed quantities rather than five minus spaces?
14. Why does seeding use $setOnInsert?
15. Which local tests use an adapter, and what can only be proved against Atlas?

## Small edits to rehearse

Change the default sort direction, adjust a form error message, add a teacher association, set a lesson's spaces to an absolute value through Postman, and trace an unavailable-image response. Explain the relevant code before and after each change.

## Honest completion record

Mark a rehearsal complete only after the student performs it independently. The current automated tests and agent browser walkthrough do not stand in for student understanding or the assessed demonstration.
