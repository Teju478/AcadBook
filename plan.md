# Academic Event & Resource Booking Portal — Foundation Plan

## Implementation approach

Build one reusable full-stack JavaScript application with a React single-page frontend and a Node.js/Express backend. The frontend owns the shared shell, role-aware navigation, public directory, institution portal, User/Admin registration and login surfaces, dashboard views, resource browsing, booking flows, profiles, and Admin management surfaces. The backend owns API routing, validation boundaries, Mongoose models, MongoDB Atlas connection setup, and a small seed-on-demand endpoint for the four predefined institutions only.

The first phase intentionally establishes the complete page and route foundation with realistic loading, empty, and error states while keeping persistence boundaries explicit. The frontend uses API calls through a small client layer rather than final hard-coded data. The API returns an empty-state response when MongoDB Atlas is not configured or contains no resources/bookings, and the UI explains what is happening. The four institution records are constrained in backend constants and are not user-created through the UI. The FSD demonstration adds an invitation-gated Admin Registration page and idempotent seeded inventory without changing the visual system.

The app will be exportable as a conventional repository: `frontend/` contains the Vite React client and `backend/` contains the Express API. Root scripts orchestrate both in development, while backend production serving is prepared to serve the built frontend when present. `.env.example` documents `MONGODB_URI`, `PORT`, and frontend API configuration without committing secrets.

## Project structure

```text
acadbook/
├── frontend/
│   ├── public/
│   │   └── manus-routes.json
│   ├── src/
│   │   ├── components/       # AppShell, Sidebar, Topbar, UI state components
│   │   ├── data/             # UI-safe institution metadata and navigation config
│   │   ├── layouts/           # Public, role-based layout wrappers
│   │   ├── pages/             # route-level screens for public/User/admin
│   │   ├── services/          # fetch client and API helpers
│   │   ├── styles/            # global CSS and tokens
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/            # environment and MongoDB connection
│   │   ├── constants/         # the four allowed institutions
│   │   ├── controllers/       # request handlers
│   │   ├── middleware/        # error and request middleware
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/             # /api/health, institutions, resources, bookings
│   │   ├── seed/               # idempotent institution and demonstration-resource seeding
│   │   └── server.js
│   └── package.json
├── .env.example
├── package.json
├── package-lock.json
├── Dockerfile
├── README.md
├── TODO.md
└── plan.md
```

## Data and backend boundaries

- **Institution**: slug, name, location, short code, description, accent metadata; created only from the predefined allow-list.
- **Resource**: institution reference, name, category, description, capacity, location, availability flag, equipment, image key; resource management endpoints are scaffolded for admin use.
- **Booking**: institution, resource, requester identity/role, date, start/end time, purpose, status (`pending`, `approved`, `rejected`, `cancelled`); booking request and admin review routes are scaffolded with validation.
- **User**: institution, role (`user`, `admin`), name, email, bcrypt password hash, status, and last-login timestamp; public User registration and invitation-gated Admin registration use institution-specific HTTP-only JWT sessions.

MongoDB Atlas is the only intended application database. Mongoose is the only persistence ODM. The app must never create colleges dynamically and must not use a Manus database, Firebase, Supabase, or an embedded sample-data database.

## Design direction

### Shortlist

- **Swiss editorial campus — 0.08:** disciplined typography and information hierarchy make institutional workflows feel clear and trustworthy.
- **Quiet civic modernism — 0.06:** warm neutrals, precise cards, and civic signage cues make the portal feel dependable and human.
- **Technical atlas — 0.04:** dark navigation, grid marks, and data-forward panels emphasize operational visibility.

### Chosen movement: Quiet civic modernism

- **Core principles:** calm orientation, visible status, generous breathing room, and precise utility.
- **Color philosophy:** a deep ink navy anchors trust; warm parchment surfaces make the portal feel like a shared campus record; one ownable saffron signal color marks action and progress without turning the UI into a loud SaaS dashboard.
- **Layout paradigm:** an editorial two-column composition: a slim, anchored navigation rail on the left and content that unfolds in asymmetric bands on the right. Public pages use a wide directory canvas with a narrow contextual rail rather than a centered marketing stack.
- **Signature elements:** small “campus mark” glyphs beside section labels; saffron underline rules on active navigation; quiet status chips with a left-edge marker.
- **Interaction philosophy:** every action should answer “where am I, what can I do next, and what changed?” Search and filters are immediate and lightweight; destructive or irreversible actions are visually separated.
- **Animation:** restrained 160–220ms ease-out transitions for cards, nav selection, and state changes; no looping decorative motion; loading uses compact skeleton bars and a single pulse.
- **Typography system:** `DM Sans` for interface text paired with `Space Grotesk` for display headings and section numerals. Headings are compact and slightly tracked; body copy remains highly readable at 15–16px.
- **Brand essence:** a shared academic operations desk for institutions, learners, User, and Admins; personality: assured, considerate, exact.
- **Brand voice:** direct and supportive. Example lines: “Reserve the room before the moment arrives.” and “Your request is in the queue; we’ll show you what happens next.”
- **Wordmark & logo:** an interlocking four-bar campus mark, suggesting four institutions connected by one booking rail, paired with the `AcadBook` wordmark.
- **Signature brand color:** saffron `#E7A43B`, used only for primary actions, active rules, and booking progress.

## Build workflow

1. Install root, frontend, and backend dependencies using the pinned npm toolchain and checked-in lockfile.
2. Run the Vite frontend and Express backend concurrently through the root development script.
3. Configure `VITE_API_BASE_URL` for the client and `MONGODB_URI` for Atlas; backend remains healthy even when Atlas is unavailable so the frontend can show a clear error/empty state.
4. Keep route declarations synchronized in `frontend/public/manus-routes.json`.
5. Run syntax/build checks, verify the health and public institution endpoints, and inspect the Preview at desktop and mobile breakpoints. Atlas connectivity is only reported as tested when real credentials are supplied.
6. Commit the exportable source tree and documentation to the canonical project remote; publish only if separately requested.

## Phase scope

This phase delivers the reusable shell, all requested route surfaces adapted to exactly two portals (User and Admin), consistent navigation, institution allow-list, MongoDB/Mongoose backend, password hashing, invitation-gated Admin registration, JWT cookie sessions, role/institution authorization, protected frontend routes, controlled Admin bootstrap, 16 realistic demonstration resources, real resource categories and unit booking, Atlas-backed availability and dashboards, transaction-serialized approval conflict enforcement, visible loading/empty/error states, setup documentation, and export-ready scripts. Email verification, password reset, and notifications remain future extensions in this same codebase.
