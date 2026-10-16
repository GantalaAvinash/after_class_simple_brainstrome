# AfterClass backend — foundation milestone

This is a staged CST3144 implementation, not a complete coursework submission.

## Current behaviour

- Express 5 with the official MongoDB driver; no Mongoose or local database fallback.
- `GET /lessons` reads the Atlas `lesson` collection.
- `GET /health` checks database connectivity and returns 503 during a database outage.
- Request logs include timestamp, method, URL, status, and duration, but not request bodies or credentials.
- CORS allows only configured frontend origins, including JSON POST/PUT preflight.
- Configuration is checked before startup; the server does not start with missing database credentials.
- The seed adds twelve lessons with five initial spaces and four teachers. Re-running it preserves existing lessons, teacher records, and purchases.

Order routes, lesson updates, image middleware, search, teacher routes, enrolment, and checkout transactions are pending later reviewed stages.

## Local setup

Use Node 24. Run `npm ci` in this folder. Enter the Atlas connection string into the ignored `.env` file's `MONGODB_URI` value. Replace the connection string's credential placeholders with your database user's actual values, URI-encoding reserved password characters. Never paste the value into chat, commit it, or include it in an export.

The Atlas database user must have read/write access to the `afterclass` database. Atlas network access must permit the connection source. Keep the access list restricted to your development IP and the hosting service's documented outbound IP ranges.

Run these separately, checking each result:

```sh
npm seed
npm run check:atlas
npm start
```

The connection probe attempts a transaction write and deliberately aborts it. It does not create a purchased order. Open `http://localhost:3000/health` and `http://localhost:3000/lessons` after startup.

## Verification

```sh
npm test
```

The foundation tests use an isolated database stub and real local HTTP requests. They verify HTTP behaviour and do **not** prove that Atlas is connected. `npm run check:atlas` is a separate real-Atlas check. Integration/concurrency tests against a separate Atlas test database are pending.

## Render configuration

- Connect the separate backend repository.
- Use a web service with Node 24, build command `npm ci`, start command `npm start`, and health-check path `/health`.
- The service name must include the real student number.
- Add `MONGODB_URI`, `DATABASE_NAME`, and `FRONTEND_ORIGINS` as Render environment variables. Let Render provide `PORT`.
- For GitHub Pages, the allowed origin is `https://ACCOUNT.github.io`, without the repository path or trailing slash.
- Seed explicitly from the development machine; startup never resets the database.

The GitHub repository and Render URL have not yet been created or verified.

## Assistance record

The root workspace contains `AI_ACKNOWLEDGEMENT.md`. Copy the completed record into the final submission and keep it accurate as development progresses. Student review of this foundation is pending.
