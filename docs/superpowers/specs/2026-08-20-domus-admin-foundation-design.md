# Domus Admin System — Foundation (sub-project 1 of 5)

## Context

Domus is being extended from a static marketing site into a real estate
management platform. The full request spans six pages across auth, RBAC,
CRUD, a lead pipeline, user management, and a public property detail page —
too large for one spec. This is the first of five sub-projects:

1. **Foundation** (this doc) — data model, Firebase Auth, RBAC/session
   infrastructure, Login page, protected Dashboard shell
2. Property Manager (CRUD)
3. Lead Pipeline (Kanban/Table)
4. User Management
5. Public Property Detail page (depends on real property data existing)

## Decisions (confirmed with user)

- **Firebase project**: `domus-e117e`, already created with Auth + Firestore
  enabled. Client config and Admin SDK service account are wired into
  Vercel env vars (production/preview/development) and local `.env.local`.
- **RBAC enforcement**: server-verified session cookies (Firebase Admin
  SDK), not client-only auth-state checks. The dashboard layout is a
  Server Component that verifies the cookie before rendering anything.
- **Roles**: `admin` and `sales`, two roles only.
  - `sales`: Lead Pipeline only.
  - `admin`: everything (Properties, Pipeline, Users).
- **Property images**: URL fields for this phase, not Firebase Storage
  upload (may upgrade later — out of scope here).
- **First admin account**: created manually by the user in Firebase
  Console (Auth user + matching Firestore `users/{uid}` doc with
  `role: "admin"`) — no seed script needed for Foundation.
- **Data authorization model**: all dashboard reads/writes go through
  Server Components / Server Actions using the Admin SDK, not the client
  Firestore SDK. This keeps authorization logic in one place (the
  already-verified server session) instead of duplicating it in Firestore
  security rules. Firestore rules stay deny-all for client access, as
  defense in depth — the client SDK's only job in this app is
  `signInWithEmailAndPassword` / `signOut`.

## Firestore data model

```
users/{uid}
  email: string
  displayName: string
  role: "admin" | "sales"
  active: boolean
  createdAt: Timestamp

properties/{id}
  title: string
  description: string
  price: number
  currency: string
  location: string
  tag: string                 // e.g. "Frente al Mar"
  status: "available" | "reserved" | "sold"
  images: string[]
  features: string[]
  bedrooms: number
  bathrooms: number
  areaM2: number
  createdAt, updatedAt: Timestamp
  createdBy: string           // uid

leads/{id}
  name, email, phone: string
  source: string
  status: "new" | "contacted" | "qualified" | "visit_scheduled"
        | "negotiation" | "won" | "lost"
  assignedTo: string           // uid
  propertyId?: string
  createdAt, updatedAt: Timestamp

leads/{id}/activities/{activityId}
  type: "call" | "whatsapp" | "email" | "note" | "status_change"
  note: string
  createdAt: Timestamp
  createdBy: string            // uid
```

Only `users` and the `role` field are actually read in this sub-project.
`properties` and `leads` shapes are specified now so sub-projects 2–3
don't need to re-derive them, but no code in Foundation writes to them.

## Auth / session flow

1. **Login page** (`app/(auth)/login/page.tsx`, Client Component): email
   + password form, calls Firebase client SDK
   `signInWithEmailAndPassword`. On success, gets the ID token and POSTs
   it to `/api/auth/session`.
2. **Session route handler** (`app/api/auth/session/route.ts`):
   - `POST`: verifies the ID token via Admin SDK, calls
     `createSessionCookie` (2-week expiry), sets it as an `httpOnly`,
     `secure`, `sameSite=lax` cookie.
   - `DELETE`: clears the cookie (used by logout).
3. **Dashboard layout** (`app/(dashboard)/dashboard/layout.tsx`, Server
   Component):
   - Reads the session cookie; if missing/invalid, `redirect("/login")`.
   - Verifies it via Admin SDK (`verifySessionCookie`), reads
     `users/{uid}` via Admin SDK to get `role` and `active`.
   - If `active === false`, treat as invalid session (redirect to
     `/login`).
   - Renders a shared dashboard chrome (nav with role-appropriate links,
     sign-out button) around `children`.
4. **Per-route RBAC**: `properties/page.tsx` and `users/page.tsx` re-check
   role server-side (via a shared helper) and `redirect("/dashboard/pipeline")`
   if the session's role is `sales`. This is enforced independently of
   the layout so a stub or future refactor can't accidentally drop the
   check.
5. **Logout**: a client button calls `signOut()` (client SDK) then
   `DELETE /api/auth/session`, then redirects to `/login`.
6. **Login page routing**: if a valid session already exists when hitting
   `/login`, redirect straight to `/dashboard`.

## Files this sub-project creates

- `lib/firebase/client.ts` — client SDK init (singleton), reads
  `NEXT_PUBLIC_FIREBASE_*` env vars.
- `lib/firebase/admin.ts` — Admin SDK init (singleton), reads
  `FIREBASE_ADMIN_*` env vars.
- `lib/auth/session.ts` — `getSession()` helper (reads + verifies cookie,
  returns `{ uid, role, active } | null`), used by the layout and each
  protected page.
- `app/api/auth/session/route.ts` — POST/DELETE session cookie handlers.
- `app/(auth)/login/page.tsx` — login form.
- `app/(dashboard)/dashboard/layout.tsx` — RBAC guard + dashboard chrome.
- `app/(dashboard)/dashboard/pipeline/page.tsx` — stub (admin + sales).
- `app/(dashboard)/dashboard/properties/page.tsx` — stub (admin only).
- `app/(dashboard)/dashboard/users/page.tsx` — stub (admin only).
- `firestore.rules` — deny-all default rules (defense in depth).

Stub pages render a heading and "coming in sub-project N" note — enough
to prove the RBAC redirect logic works end-to-end without building the
real CRUD/Kanban UI yet.

## Testing

- Manual: log in as an admin user → land on `/dashboard`, see all three
  nav links, visiting any of the three pages works.
- Manual: log in as a sales user → nav shows Pipeline only; hitting
  `/dashboard/properties` or `/dashboard/users` directly by URL redirects
  to `/dashboard/pipeline`.
- Manual: hit `/dashboard` with no session → redirects to `/login`.
- Manual: hit `/login` with a valid session → redirects to `/dashboard`.
- Manual: an `active: false` user's session is treated as invalid.

No automated tests in this sub-project — it's almost entirely
integration-shaped (real Firebase project, real cookies); manual
verification against the real `domus-e117e` project is the practical
check.
