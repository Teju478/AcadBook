# Academic Event & Resource Booking Portal — Delivery Checklist

## 1. Exportable full-stack foundation

- [x] Use JavaScript throughout with separate `frontend/` and `backend/` folders.
- [x] Use React.js for the frontend, Node.js with Express.js for the backend, MongoDB Atlas with Mongoose for persistence.
- [x] Do not use Next.js backend routes, Python, Flask, Firebase, Supabase, or a proprietary Manus database.
- [x] Document local setup, environment variables, development commands, production build behavior, and MongoDB Atlas configuration.
- [x] Keep the same project structure suitable for later phases; do not rebuild the project in a later phase.

## 2. Predefined institution directory

- [x] Use only these four predefined institutions: Easwari Engineering College — Ramapuram, Chennai — `easwari-engineering-college`; SRM Medical College Hospital and Research Centre — Kattankulathur, Tamil Nadu — `srm-medical-college`; SRM Arts and Science College — Kattankulathur, Chennai — `srm-arts-and-science-college`; Valliammai Engineering College — Kattankulathur, Chennai — `valliammai-engineering-college`.
- [x] Build a public Homepage / Institution Directory with search and college cards.
- [x] Build a reusable Institution Portal route driven by institution slug.
- [x] Do not add any form or backend route for creating colleges.
- [x] Serve all institutions from one reusable application, not four separate applications.

## 3. Public pages and navigation

- [x] Build User Registration for authorized User, staff, and department coordinators.
- [x] Build User and Admin login pages.
- [x] Allow Admin registration only through the invitation-gated Admin Registration page or controlled backend bootstrap method; never allow unrestricted Admin creation.
- [x] Keep public navigation consistent and visibly distinguish institution context where applicable.

## 4. User pages

- [x] Build User Dashboard.
- [x] Build Browse Resources for the User workspace.
- [x] Build Resource Details.
- [x] Build Availability and Booking Request.
- [x] Build Booking Confirmation.
- [x] Build My Bookings.
- [x] Build My Profile.
- [x] Provide clearly identified loading, empty, and error states on data-dependent screens.

## 5. User booking coverage

- [x] Preserve the same User workspace for authorized User, staff, and department coordinators.
- [x] Build Browse Resources.
- [x] Build Resource Details and Booking.
- [x] Build My Bookings.
- [x] Build My Profile.
- [x] Provide clearly identified loading, empty, and error states on data-dependent screens.

## 6. Admin pages

- [x] Build Admin Dashboard.
- [x] Build Booking Requests.
- [x] Build Booking Request Details.
- [x] Build All Bookings.
- [x] Build Resource Management.
- [x] Build Add/Edit Resource.
- [x] Build Users Directory.
- [x] Build Admin Profile.
- [x] Provide clearly identified loading, empty, and error states on data-dependent screens.

## 7. Backend contracts

- [x] Add Express health endpoint.
- [x] Add MongoDB Atlas connection using Mongoose and environment configuration.
- [x] Add Institution, User, Resource, and Booking Mongoose models.
- [x] Seed only the four predefined institutions and idempotently ensure 16 demonstration resources after a successful Atlas connection.
- [x] Add read endpoints for the four institutions and authenticated, institution-scoped resource browsing.
- [x] Add authenticated booking request and requester-scoped booking list contracts.
- [x] Add Admin-only resource and booking-request route contracts.
- [x] Do not use hard-coded sample data as the final backend; document Atlas seeding/empty behavior instead.

## 8. Authentication and authorization

- [x] Implement User registration with institution selection, password validation, bcrypt password hashing, and automatic login session creation.
- [x] Implement login and logout for Users and Admins with institution-specific account lookup.
- [x] Store authentication secrets and MongoDB Atlas connection values only in backend environment variables; keep `.env.example` secret-free and never expose credentials in React code.
- [x] Implement backend JWT verification through an HTTP-only cookie and active-user checks on protected requests.
- [x] Implement role-based authorization for User and Admin endpoints.
- [x] Enforce institution-specific account, resource, booking, and user-directory access.
- [x] Add protected frontend route groups that redirect unauthenticated or wrong-role users to the correct login/workspace.
- [x] Protect Admin Registration with the project-level invitation code, hash passwords, store the selected institution and `admin` role, and retain the token-controlled bootstrap endpoint for recovery.
- [ ] Verify a real Atlas connection with user-supplied credentials; no credentials were supplied for this implementation phase.

## 9. Responsive product foundation

- [x] Use reusable components for the shell, navigation, cards, chips, forms, data states, and dashboards.
- [x] Support desktop and mobile layouts without duplicating the application per institution or role.
- [x] Keep route manifest synchronized with all public and application page routes.

## 10. Live resources and conflict-safe bookings

- [x] Connect resource search, filters, resource details, availability, bookings, confirmation, My Bookings, Admin requests, and dashboards to real Express APIs and MongoDB Atlas records; do not use mock data for completed functionality.
- [x] Support resource categories: seminar halls, classrooms, laboratories, and other institutional resources.
- [x] Support whole-resource booking and individual seat/workstation booking where a resource publishes units.
- [x] Persist booking date, start time, end time, purpose, booking scope/unit, requester, institution, status, review metadata, and rejection reason.
- [x] Implement statuses Pending, Approved, Rejected, and Cancelled; allow Users to cancel their own pending or approved bookings.
- [x] Keep pending requests non-reserving; only approved bookings participate in availability and conflict checks.
- [x] Recheck resource and unit availability when an Admin approves a request.
- [x] Prevent overlapping approved bookings for the same whole resource or individual unit.
- [x] Make whole-resource bookings conflict with overlapping bookings of units inside that resource, and vice versa.
- [x] Allow different individual units to be booked at the same time when no conflict exists.
- [x] Allow a booking ending at 11:00 and another starting at 11:00.
- [x] Protect simultaneous approval operations with a MongoDB transaction and per-resource/date approval lock.
- [x] Show rejection reasons and persistent booking history in Users workspaces.


## 11. Exactly two portal roles

- [x] Remove separate User and User role contracts and use exactly `user` and `admin` in frontend routes, protected guards, backend authorization, Mongoose user records, and booking requester records.
- [x] Preserve the existing reusable UI, resource, availability, booking, dashboard, and institution-isolation workflows under the User portal; keep resource management, booking review, and Users Directory under Admin.
- [x] Keep public User registration institution-specific and require the project-level invitation code for Admin registration.
- [x] Add an opt-in, idempotent migration command for existing Atlas records without deleting data or running a destructive startup migration.
- [ ] Run the migration and verify both portals against a real Atlas database after the owner supplies credentials.

## 12. FSD demonstration extension

- [ ] Test User registration, invitation-gated Admin registration, and both login flows against Atlas.
- [ ] Verify resource loading, booking requests, Admin approval/rejection with reasons, booking history, and overlapping booking prevention end to end.
- [ ] Preserve institution isolation and the existing React, Express, MongoDB Atlas, and visual design boundaries.
