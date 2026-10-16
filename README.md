# AfterClass frontend — foundation milestone

This is a staged CST3144 implementation, not a complete coursework submission.

## Current behaviour

Vue 3.5.44's production browser build is pinned in `index.html`. The Options API manages loading, error, empty-result, and lesson-list states. The list uses `v-for`; the retry button uses `v-on`. Data is retrieved using native promise-based `fetch`, not Axios or XMLHttpRequest.

Sorting, cart, checkout, teacher filtering, search, and final lesson images are pending later reviewed stages.

## Run locally

Start the configured backend first. From this folder run:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080`. With a blank `apiBaseUrl` in `config.js`, localhost development uses `http://localhost:3000`.

## GitHub Pages

Set the public `apiBaseUrl` in `config.js` to the actual HTTPS Render address. Do not enter database credentials here. Publish the separate frontend repository's `main` branch and root folder. `index.html`, relative asset references, and `.nojekyll` are already present.

The repository URL and GitHub Pages URL have not yet been created or verified.

## Third-party software

- Vue 3.5.44: https://vuejs.org/ — MIT licence: https://github.com/vuejs/core/blob/main/LICENSE
- Pinned production script: https://cdn.jsdelivr.net/npm/vue@3.5.44/dist/vue.global.prod.js

There are no third-party lesson images in this milestone. Seeded image paths identify assets still to be added and checked.

## Explanation check

Before the next implementation stage, explain what `mounted`, `data`, `v-for`, `v-on`, `await fetch`, and `response.ok` do, and trace one request through Express to Atlas.
