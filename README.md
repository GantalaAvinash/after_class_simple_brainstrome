# AfterClass frontend

Vue 3.5.44 standalone browser ESM, Options API, plain JavaScript and CSS. There is no build step and no frontend JavaScript library beyond Vue.

## Local use

The real application requires the configured Express/Atlas backend. Serve this folder:

~~~sh
python3 -m http.server 8080 --bind 127.0.0.1
~~~

Open http://127.0.0.1:8080. Blank apiBaseUrl in config.js uses http://localhost:3000 only during localhost development.

For a separate, explicitly labelled fixture preview, run npm run preview:test from the sibling backend folder and open http://127.0.0.1:8081. This is test data, not an assessment deployment or MongoDB substitute.

## Tests

~~~sh
node --test test/*.test.mjs
~~~

Tests cover eight sort combinations, numeric comparisons, cart capacity/removal, contact validation, request errors, persistence and lost-response retries. Manual Chrome checks cover a complete fixture purchase, numeric search plus teacher filtering, enrolment, empty-cart behaviour, and layouts at 375/768/1024/1440 pixels. See the workspace verification log for limits.

## Behaviour

- state.mjs derives sorted lessons and displayed availability without mutating server stock. Cart quantities are independent of the currently filtered results.
- api.mjs uses promise-based fetch, checks HTTP success, retains error status for recovery, and supports cancellation and a 90-second timeout for cold starts.
- checkout.mjs saves a checkout request ID before submission and retries the same order. Only an unfinished checkout is saved in session storage; ordinary browsing carts are in memory.
- app.js connects these functions with Vue computed state, methods, watchers and lifecycle hooks. Version checks and cancellation prevent an old search response overwriting a newer one.
- Search uses stored server availability. Unsaved basket selections do not reserve database places.
- Names contain A–Z letters only; phones contain digits only, preserving leading zeros. The form follows the brief's literal rule.
- Uncertain submissions lock basket/contact edits until retried. Confirmed orders clear the cart; definitive input or stock conflicts preserve the basket for correction.

## GitHub Pages

Set config.js apiBaseUrl to the actual HTTPS Render origin. Publish this repository's main branch and root folder. Relative paths and .nojekyll support project Pages URLs. The production configuration must not enable testPreview.

Configure the backend's FRONTEND_ORIGINS as the GitHub Pages origin without a repository path, for example https://ACCOUNT.github.io. Do not store database credentials in this frontend.

## Attribution

- Vue 3.5.44: official npm browser runtime, locally vendored. Source/integrity: vendor/VERSION.md; MIT licence: vendor/LICENSE.vue.
- Lesson SVGs are served by the backend and attributed there.
- favicon.svg is the unmodified Lucide palette SVG from version 0.468.0, under the ISC licence in vendor/LICENSE.lucide.
- No remote font service, CSS framework, icon JavaScript library, or generated raster image is required.

The workspace AI_ACKNOWLEDGEMENT.md records actual assistance. Student explanation review and real hosted verification remain pending.
