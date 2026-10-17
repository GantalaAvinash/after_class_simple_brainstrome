# Safari loading and Studio sign-in investigation — 17 October 2026

This is developer-directed, Codex-assisted technical verification. Student independent review or rehearsal is not established.

## Findings

A normal-Safari sign-in took **34.088 seconds**. Its Network capture reported **31.180 seconds blocked/queued**, then **2.907 seconds waiting for the response**, followed by less than one millisecond downloading. While Safari was stuck, direct HTTP/2 preflight and health requests completed in approximately 0.115 and 0.14–0.34 seconds. A temporary loopback HTTP gateway to the same deployed API completed normal-Safari sign-in in 3.04 seconds, with its upstream password request taking 2.834 seconds. The extra delay was outside password verification, rather than a 30-second MongoDB query.

The production Node 24 HTTP listener used its default **5-second idle connection timeout**. Render documents a **75-second upstream connection reuse window**, so the application could close a connection while Render still considered it reusable. The listener now uses **120 seconds for keepAliveTimeout and headersTimeout**. This is a confirmed deployment configuration defect and follows [Render's official explanation](https://render.com/tutorials/when-deploys-go-wrong/runtime-errors). A real socket test proves the corrected listener reuses the same socket after 6.1 seconds, beyond the old cutoff.

A controlled raw JSON sign-in comparison in normal Safari remained pending without a response and was cancelled by reloading its diagnostic page. One subsequent raw form sign-in failed without HTTP headers after 43.095 seconds. That adverse result is retained. The server timeout correction alone therefore does not establish that every Safari transport failure is eliminated. No provider packet trace was available; an exact Safari/QUIC or Private Relay defect is **not** claimed. HTTP/3 was observed on successful browser requests; observing that protocol is not proof of its culpability.

## Delivered corrections

- The production listener uses Render-compatible 120-second idle/header timeouts, with a real idle-socket regression test.
- Studio uses scoped URL-encoded form sign-in, avoiding the JSON-only preflight dependency. Express still supports the original JSON API for Postman and existing clients. Special password characters are encoded correctly.
- Studio first verifies **GET /health in the same Safari context** before submitting credentials. An externally warmed Render process does not establish the browser's connection. The harmless read uses existing bounded transport recovery; a failed/unexpected health response prevents password submission. The sign-in POST itself is **never automatically replayed**.
- Progress messages distinguish connecting, checking credentials and opening protected data. A roughly three-second secure verification is no longer misrepresented as an unexplained connection wait.
- Cookie credentials are explicitly omitted; bearer sessions remain in memory. Request IDs and non-secret Server-Timing phases distinguish app, authentication database, password derivation and session database durations. Only permitted origins receive timing visibility.
- CORS preflights return explicit bodyless 200 responses without entity ETags, while exact allowed origins and authorization checks remain enforced. Every actual data/authentication request remains fresh and checked.

No dependencies, paid service upgrades, browser privacy/security changes, password-hash reductions, credential saves, stock resets or live business-data edits were made. The temporary gateway was stopped. Credential-bearing raw HAR was removed after allowlisted timing extraction.

## Measured verification

| Normal Safari check | Result |
|---|---|
| Baseline sign-in | 34.088 s; 31.180 s blocked/queued |
| Raw public round 1, no retry/warm-up | 10/10 HTTP 200; 143–372 ms |
| Raw public round 2, after 59.273 s idle | 10/10 HTTP 200; 133–325 ms |
| Raw public round 3, after the adverse raw login | 10/10 HTTP 200; exact timings in JSON |
| Three raw current form sign-ins | 3/3 HTTP 201; 3112, 2959 and 3031 ms; protected lists/overview and logout all succeeded |
| Secure password verification | Approximately 2.5–2.8 s on the free service; scrypt parameters unchanged |
| Local backend/frontend regressions | 56 + 34 passed; zero failures |
| Native separate Atlas tests | 3 passed, zero skips/failures |
| Postman isolated Atlas | 37 requests / 52 assertions passed |
| Postman hosted read-only | 14 requests / 23 assertions passed |

Actual application UI results are recorded below. Raw transport comparisons use the developer connection-check page, without automatic retries or the Studio health handshake. They are not silently substituted for actual UI verification. [Sanitised evidence](safari-root-cause-2026-10-17.json) contains both successes and adverse comparisons.

Live assessment data remained 12 active lessons, four public teachers, 57 available places and one confirmed order purchasing three places for £70. The soft-deleted QA teacher remains preserved. Auth sessions/counters are operational state and are excluded from assessment exports.

## Reproducing safely

Use the public application and Studio in normal Safari. Studio's first connection phase may take longer if the free service has actually slept. Sign in with the privately handed-over credential; inspect the library, team and insights, then sign out. Never put a password/token in a URL, screenshot, report or repository. Keep destructive/checkout tests on disposable fixtures or the separate test database. A network/provider failure can still occur; distinguish it from an HTTP validation/authentication error using the request ID and phase timings, without weakening security controls.


## Actual application UI results and remaining gate

Pages workflow 39033318734 deployed the corrected application at 6b5f261; Render deployment dep-db9mjc5g1s2s73997pd0 runs backend c5b4728. A subsequent diagnostic-only release added a controlled same-tab comparison: the application client and raw /health request both succeeded in **156 and 161 ms**. This rules out a consistently broken request wrapper; it does not prove that every connection will succeed.

In normal Safari, **three fresh public-page loads** showed all twelve lessons and four named teachers without an error. Add feedback, View cart, one-to-two quantity/£20-to-£40 changes, decrement, last-line removal, restored four Art Workshop spaces and optional email visibility passed. No order was submitted.

**Three actual Studio sessions** loaded the protected library and were signed out. The latest two fresh sessions were ready within the observation bounds of **5.877 and 3.803 seconds** (these include UI observation overhead and are not isolated server benchmarks). Teacher management showed four active profiles with three lesson assignments each; booking insights preserved Art Workshop quantity one and Coding Club quantity two, £70 total. Password storage prompts were dismissed.

**Remaining gate:** the first application connection attempt still reached its bounded deadline on /health, before submitting credentials. A following traced attempt recovered through a read retry and opened Studio; its exact completion time was not captured, so it is not presented as a fast benchmark. These failures remain in the JSON alongside successful repetitions. The confirmed server timeout defect is corrected, and the UI now handles connection setup explicitly, but the evidence does **not** establish complete elimination of the intermittent Safari transport issue. Further isolation needs browser/provider network tracing; no unverified security-setting change or hosting purchase was made.


The handover ZIP was refreshed and clean-installed: 56 backend and 34 frontend tests passed, zero failures, with the same three intentional credential-gated native skips in that extracted run. Its application bytes match the separately Atlas-tested workspace. See [package evidence](safari-package-check-2026-10-17.json); archive integrity and the final SHA-256 are saved alongside the local ZIP. The documented Safari limitation remains open.
