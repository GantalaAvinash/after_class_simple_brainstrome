# 002 — Detailed lessons and teacher administration

Accepted 16 October 2026 after the user identified missing lesson pages and teacher creation. Retain the existing native stack, assessment routes and authentication.

- Add public GET `/lessons/:id` for an active lesson with overview, outcomes, age guidance, duration and active teacher profiles. Existing records may omit descriptive fields; the page shows explicit missing-content states. Add optional editable fields with strict size/type limits. The twelve fictitious seed lessons include example programme content, without invented real credentials or schedules.
- Use a shareable `#/lessons/:id` route within the existing Vue application. Keeping one state owner preserves the basket while navigating details and back. The route fetch has cancellation/version checks for rapid navigation and deletion/error states.
- Add protected teacher list/create/edit/delete/restore endpoints with existing opaque sessions, UUID replay, audit records, native transactions and revision checks. Teacher membership remains stored only on `teacher.lessonIds`; derived lesson membership avoids duplicated relationships.
- Association changes touch affected lesson revisions. Lesson-side assignments touch affected teacher revisions. Native transaction write conflicts and revision guards prevent stale editors on either side undoing an assignment. No stock or order history is changed by teacher management.
- Teacher soft deletion excludes the profile/filter publicly and retains associations for restore. Deleted lessons remain hidden even when assigned to an active teacher. Reject assignments to deleted teachers from the lesson editor.
- No new broker, identity provider, runtime dependency or enterprise framework is required. Extend contracts, Postman, local and isolated Atlas tests, and acknowledgement. Do not claim unrun Atlas/hosted checks.
