# Cosmiq OS web

Next.js public website and enquiry intake for the proposed Cosmiq OS pilot. The workflow on `/demo` is an illustrated prototype; agent integrations are not implemented here.

## Local development

Requires Node.js 20.9+ and npm.

```powershell
npm install
npm run dev
```

Open http://localhost:3000. Enquiries are written to a local SQLite database at `data/enquiries.db` by default. The database is ignored by Git.

Staff sign-in at `/staff/enquiries` is disabled until you provide **both** `STAFF_PASSWORD` and a `STAFF_SESSION_SECRET` of at least 32 characters in `.env.local`. See `.env.example` for the full configuration. Do not commit `.env.local`.

For deployment, configure `LIBSQL_DATABASE_URL` and `LIBSQL_AUTH_TOKEN` for a persistent remote libSQL database. Local file storage is for development on a persistent machine; it is not suitable for an ephemeral/serverless host. Set a strong staff password and session secret, and serve over HTTPS. For a larger team, replace the shared staff password with individual accounts and managed authentication.

## Check and test

```powershell
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright starts a separate production server on port 3100 with its own test database and test-only staff credentials. A normal local server can continue running on port 3000 during tests.

## Structure

```text
app/                         # public pages, staff page, API routes
components/LeadForm.tsx      # shared enquiry form
lib/validation.ts            # input contract and automation selections
lib/store.ts                 # SQLite/libSQL storage, replaceable with remote URL
lib/staff-session.ts         # signed, HTTP-only staff session
data/                        # local database (ignored by Git)
tests/e2e/                   # Playwright desktop and mobile journeys
```
