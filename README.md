# AcadBook — Academic Event and Resource Booking Portal

AcadBook is one reusable full-stack academic resource booking portal for four predefined institutions. It uses React/Vite on the frontend, Node.js/Express on the backend, and MongoDB Atlas through Mongoose.

## Stack and roles

- **Frontend:** React, Vite, React Router
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas with Mongoose
- **Authentication:** bcrypt password hashing and JWT sessions in an HTTP-only cookie
- **Language:** JavaScript
- **Roles:** exactly two portal roles — **User** and **Admin**

The project does not use Next.js backend routes, Python, Flask, Firebase, Supabase, or a proprietary application database.

## Institutions

The application contains one shared application and these four predefined institutions only:

- Easwari Engineering College — `easwari-engineering-college`
- SRM Medical College Hospital and Research Centre — `srm-medical-college`
- SRM Arts and Science College — `srm-arts-and-science-college`
- Valliammai Engineering College — `valliammai-engineering-college`

Users, Admins, resources, and bookings are institution-scoped on the backend. Changing an institution ID in browser code cannot bypass that isolation.

## Project layout

```text
frontend/                         React/Vite application
  public/assets/institutions/      Local institution-card images
  src/                             Routes, pages, components, API client, styles
backend/                          Express/Mongoose API
  src/models/                      Institution, User, Resource, Booking models
  src/controllers/                Auth, resource, availability, booking controllers
  src/seed/                       Idempotent institution/resource seed logic
  src/scripts/migrateRoles.js     Optional migration for older role names
.env.example                      Root local-development template
backend/.env.example              Backend-only execution template
frontend/.env.example             Frontend-only execution template
package-lock.json                 Reproducible dependency versions
frontend/dist/                    Latest generated frontend build included in the ZIP
Dockerfile                        Exportable container recipe
```

## Requirements

Install these before opening the project in VS Code:

- Node.js 20 or newer, with npm
- A MongoDB Atlas account and an existing Atlas cluster
- Git (optional, useful for version control)

## Use an existing MongoDB Atlas cluster locally

You do **not** need to create another cluster for local execution. Use the same existing Atlas cluster and database that AcadBook already uses:

1. In Atlas, open the existing project and cluster.
2. In **Database Access**, confirm the database user used by AcadBook is active. This is separate from your Atlas website password.
3. In **Network Access**, allow the public IP address of the computer running the backend. For a short academic demonstration only, `0.0.0.0/0` can be used; restrict it afterward.
4. Select **Connect → Drivers → Node.js** and copy the existing `mongodb+srv://...` URI.
5. Keep the existing database name in the URI. Replace only the placeholders for the Atlas database username/password if necessary, and URL-encode special characters in credentials.
6. Do not paste the URI into React code or commit it to Git.

The backend reports the actual state at `GET http://localhost:4000/api/health`:

- `mongodb-atlas-connected` means Mongoose is connected.
- `mongodb-atlas-not-configured` means `MONGODB_URI` is empty.
- `mongodb-atlas-connection-failed` means Atlas rejected or could not complete the connection.

## VS Code setup — recommended root workflow

Open the unzipped `acadbook` folder in VS Code, then open the integrated terminal at the repository root.

### 1. Configure secrets

```bash
cp .env.example .env
```

Edit `.env` and set:

```dotenv
MONGODB_URI=mongodb+srv://<atlas-user>:<atlas-password>@<existing-cluster>/<existing-database>?retryWrites=true&w=majority
AUTH_SESSION_SECRET=<long-random-secret>
ADMIN_INVITATION_CODE=<private-project-invitation-code>
```

For local HTTP use these values:

```dotenv
PORT=4000
CORS_ORIGIN=http://localhost:3000
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
AUTH_SESSION_DURATION=7d
VITE_API_BASE_URL=/api
```

Generate a session secret locally without putting it in source control:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Never commit `.env`. The root `.gitignore` excludes it.

### 2. Install dependencies

```bash
npm install
```

This installs both workspace packages from the root `package-lock.json`. Do not copy or commit `node_modules`; it is platform- and operating-system-specific.

### 3. Start both services

```bash
npm run dev
```

The frontend runs at <http://localhost:3000> and the backend runs at <http://localhost:4000>. Vite proxies `/api` requests to Express.

If you prefer two VS Code terminals:

```bash
# Terminal 1 — backend
npm run dev --workspace backend

# Terminal 2 — frontend
npm run dev --workspace frontend
```

### 4. Verify Atlas

```bash
curl http://localhost:4000/api/health
```

Continue only when the response contains:

```json
"database": "mongodb-atlas-connected"
```

Open <http://localhost:3000> after the backend is ready.

## Alternative backend/frontend-only workflow

The ZIP also includes templates for running each workspace independently:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Put the Atlas and backend secrets in `backend/.env`. Put only `VITE_API_BASE_URL=/api` in `frontend/.env`. Then run:

```bash
cd backend && npm install && npm run dev
# in another terminal
cd frontend && npm install && npm run dev
```

The root workflow is preferred because it installs the pinned workspace dependencies once and uses the included Vite proxy configuration.

## Database seeding

On every successful backend connection, startup runs two safe seed operations:

- The four predefined institution records use an upsert by `slug`.
- The 16 demonstration resources use an upsert by `institutionSlug + name` with `$setOnInsert`.

It is safe to start the backend more than once or rerun the seed behavior. Existing Users, Admins, resources, and Bookings are not deleted. Existing demonstration resource records are not overwritten by the seed. The seed does not create sample bookings or sample passwords.

The resources include seminar halls, classrooms, laboratories, studios/collaboration spaces, capacity, operating metadata, equipment, and workstation-level units where supported.

## Create the first Admin securely

### Recommended demonstration path

1. Set a private `ADMIN_INVITATION_CODE` in `.env`.
2. Start the backend.
3. Open an institution portal in the browser.
4. Choose **Admin access**.
5. Select **Register with an invitation code**.
6. Use the intended name, email, password, institution, and invitation code.

Admin registration is validated by Express and creates an institution-scoped Admin record. There is no public unrestricted Admin registration.

### Controlled bootstrap path

If the registration page cannot be used, add a temporary `ADMIN_BOOTSTRAP_TOKEN` to `.env`, then run:

```bash
curl -X POST http://localhost:4000/api/auth/admin/bootstrap \
  -H 'Content-Type: application/json' \
  -H 'x-admin-bootstrap-token: replace-with-your-token' \
  -d '{"name":"Portal Admin","email":"admin@example.edu","password":"change-this-password","institutionSlug":"easwari-engineering-college"}'
```

Immediately remove or rotate `ADMIN_BOOTSTRAP_TOKEN` after the account is created. Never put either token in the frontend or ZIP.

## Booking conflict demonstration

Use two separate registered User accounts in the same institution and one Admin account in that institution:

1. User A selects a resource, date, time, and scope, then submits a request. It remains **Pending** and does not reserve the slot.
2. Admin opens the request and approves it. Approval rechecks Atlas inside a transaction and a resource/date lock.
3. User B selects the same resource, date, and overlapping time. The availability check identifies the approved conflict and opens the prominent **“Sorry! This Resource Is Already Reserved”** modal.
4. The modal shows the resource, date, reserved time, and unit when relevant. A booker name is not exposed to regular Users; institution-scoped Admin responses may include it.
5. **Find Available Times** uses backend-generated alternatives that respect operating hours, duration, approved bookings, booking scope, and workstation rules.
6. **Choose Another Resource** returns to the institution-scoped resource list. **Close** dismisses the modal.
7. Submission performs another availability check, and the backend rejects a conflict even if the browser view is stale.
8. Cancel the approved booking and wait for the safe 20-second polling refresh or refocus the page. The slot becomes available again.

Rules verified by the backend:

- Pending requests do not reserve a slot.
- Overlapping whole-resource bookings conflict.
- A whole-resource booking conflicts with any overlapping workstation booking.
- The same workstation cannot overlap.
- Different workstations can overlap when permitted.
- `10:00–11:00` and `11:00–12:00` are adjacent and allowed.
- Missing or unknown `bookingScope` in older records is treated conservatively as whole-resource scope.
- Admin approval rechecks conflicts inside a MongoDB transaction with a per-resource/date lock.

## Build and production-style local run

```bash
npm run build
npm start
```

The build writes `frontend/dist`, and the Express server can serve that built frontend. The development workflow with Vite and Express is preferred for the demonstration.

## What is in the ZIP

Included:

- Current React source and routes
- Current Express/Mongoose source, models, controllers, middleware, seeds, and scripts
- `package.json` files and `package-lock.json`
- README, `TODO.md`, `plan.md`, Dockerfile, Vite configuration, and route manifest
- Institution image assets under `frontend/public/assets/institutions/`
- The latest generated `frontend/dist` build for reference or static serving
- All current conflict detection, alternative-slot, workstation validation, login matching, institution isolation, and silent-loading source changes

Intentionally excluded:

- `.env` and all real secrets, passwords, connection strings, tokens, cookies, and credential files
- `.git` history and platform-specific project metadata
- `node_modules` and other installed dependencies; run `npm install` locally
- Temporary logs, caches, coverage output, and operating-system files

The included image assets are local institution-card assets already used by the project. There are no separate user-uploaded files required for the application. Dependencies are represented by the package manifests and lockfile, not by copied `node_modules`.

## Current verification

The current project was verified during packaging with:

- `npm run build` — passed
- `node --check` for all backend JavaScript files — passed
- `curl http://localhost:4000/api/health` — MongoDB Atlas connected
- Booking-rule regressions — passed for legacy whole-resource scope, whole-vs-unit conflicts, same-unit conflicts, different-unit parallel bookings, adjacent slots, and alternative suggestions
- Seed review — institutions use upsert; resources use idempotent `$setOnInsert`; no destructive seed operation is used
