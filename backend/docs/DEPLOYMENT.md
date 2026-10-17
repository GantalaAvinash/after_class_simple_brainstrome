# Atlas, GitHub Pages and Render deployment

## Atlas credentials and verification

Use separate database users: the application user has readWrite on afterclass; the test user has readWrite on afterclass_test. Restrict both to the chosen cluster. Do not reuse the existing project-wide administrator account. Password creation is completed privately by the account owner.

Save the complete application connection string as MONGODB_URI and the test-user connection string as MONGODB_TEST_URI in ignored backend/.env. URI-encode reserved password characters. Keep DATABASE_NAME=afterclass and MONGODB_TEST_DATABASE=afterclass_test. The application selects its database from DATABASE_NAME rather than relying on the URI path.

Allow the current development computer's IP in Atlas for local verification. For Render use the actual service's Connect → Outbound ranges; do not add unrestricted Internet access as a shortcut. Existing project access rules may also affect this cluster; review before changing rules used by other applications.

Run npm run check:atlas, npm run test:atlas, npm run seed, then npm run seed:details when migrating older seed records. The explicit native test command refuses missing credentials or an unsafe database. It runs all three files sequentially; each file's intended transaction/concurrency cases still run normally. Test cleanup removes only its own fixture records. Seeding preserves existing spaces and authored content.

## Two repositories and Pages

Publish the frontend and backend folders as separate repositories, preserving their existing commit history. Inspect tracked files before the first push: .env and .admin-local.txt must remain excluded. Choose visibility appropriate for assessment access and the GitHub Pages account plan. This application needs no frontend build step.

For branch-based Pages publishing, select main and the repository root. Keep .nojekyll. Set frontend/config.js apiBaseUrl to the actual HTTPS Render origin, with no path or trailing slash. Relative assets and hash lesson routes support project Pages addresses.

## Render web service

Create a Node web service from the backend repository. The service name/hostname must include the actual student number. Use the Free instance explicitly, build command npm ci, start command npm start, health path /health, and the Node 24.x engine specified by package.json. Select a region near the Atlas cluster before creation.

Set MONGODB_URI, DATABASE_NAME=afterclass, FRONTEND_ORIGINS, ADMIN_USERNAME and ADMIN_PASSWORD_HASH in the Render environment. FRONTEND_ORIGINS is the GitHub Pages origin without its project path or a trailing slash. Transfer the existing salted admin hash privately; never upload .env or the operator password file. Do not set MONGODB_TEST_URI in production. Render supplies PORT. Production npm start never imports the fixture preview.

After the service exists, copy its exact outbound ranges from Connect → Outbound into the Atlas allowlist and redeploy if the first connection attempt failed while access was being configured.

## Hosted completion gate

Enter the actual four URLs and student number in the workspace submission-links.json. Run npm run check:deployment. It checks Pages assets/configuration, Render database health, catalogue/details/teachers/enrolment/images, matching CORS and anonymous admin denial without creating orders or changing spaces.

Then use the hosted browser to check sorting, search/teacher combinations, detail navigation and basket stability, fictitious checkout, confirmed quantities, protected Studio and teacher assignment. Restart the Render service and confirm database-backed records persist. A sleeping free service may need a warm-up before the demonstration.

Record native/hosted results only after they pass. Export actual assessment collections with npm run export:atlas and prepare the final submission only after links, data and verification are genuine. The local fixture preview and local adapter tests do not prove hosted Atlas behaviour.

## Primary references

- [Atlas cluster connections](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/)
- [Atlas IP access lists](https://www.mongodb.com/docs/atlas/security/ip-access-list/)
- [Render Node/Express deployment](https://render.com/docs/deploy-node-express-app)
- [Render outbound addresses](https://render.com/docs/outbound-ip-addresses)
- [Render Node version selection](https://render.com/docs/node-version)
- [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
