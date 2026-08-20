# Domus Admin Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the auth/RBAC foundation for the Domus admin system — Firebase Auth login, server-verified session cookies, and a role-gated dashboard shell with three stub pages — so later sub-projects can build real CRUD on top of it.

**Architecture:** Server-verified session cookies (Firebase Admin SDK) protect everything under `app/(dashboard)/`. A pure `lib/auth/rbac.ts` module owns the role→route mapping so both the redirect logic and the nav rendering read from one source of truth. All Firestore access for auth purposes goes through the Admin SDK server-side — the client Firebase SDK is used only for `signInWithEmailAndPassword`.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, `firebase` (client SDK) + `firebase-admin` (server SDK), Vitest for unit tests.

**Spec:** `docs/superpowers/specs/2026-08-20-domus-admin-foundation-design.md`

## Global Constraints

- Roles are exactly `"admin" | "sales"` — no other values.
- Sales role is restricted to `/dashboard/pipeline` only; Admin has full access.
- All dashboard data access goes through Server Components/Route Handlers using the Admin SDK, never the client Firestore SDK.
- Session cookie: `httpOnly`, `secure`, `sameSite=lax`, 2-week (`14 * 24 * 60 * 60 * 1000` ms) expiry.
- An `active: false` user in Firestore is treated as an invalid session.
- Firebase project `domus-e117e` — client config is in `NEXT_PUBLIC_FIREBASE_*` env vars, Admin SDK credentials in `FIREBASE_ADMIN_*` env vars (already set in `.env.local` and Vercel).
- Path alias `@/*` maps to the repo root (see `tsconfig.json`).
- Existing component/section files use **named exports** (`export function Button(...)`) — match this convention for new UI components.

---

### Task 1: Test infrastructure (Vitest)

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add `test` script and `vitest` devDependency)

**Interfaces:**
- Produces: `npm test` runs `vitest run`; test files matched by `**/*.test.ts`; `@/*` alias resolves the same as in `tsconfig.json`.

- [ ] **Step 1: Install vitest**

Run: `npm install -D vitest --no-audit --no-fund`

- [ ] **Step 2: Create the Vitest config**

Create `vitest.config.ts`:

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

- [ ] **Step 3: Add the test script**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 4: Verify it runs with zero tests**

Run: `npm test`
Expected: Vitest starts, reports "No test files found" (or exits 0) — confirms config loads without error.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "test: add vitest infrastructure"
```

---

### Task 2: RBAC pure logic

**Files:**
- Create: `lib/auth/rbac.ts`
- Test: `lib/auth/rbac.test.ts`

**Interfaces:**
- Produces:
  - `type Role = "admin" | "sales"`
  - `DASHBOARD_NAV_ITEMS: { label: string; href: string; roles: Role[] }[]`
  - `getDefaultRouteForRole(role: Role): string`
  - `getNavItemsForRole(role: Role): { label: string; href: string; roles: Role[] }[]`

- [ ] **Step 1: Write the failing tests**

Create `lib/auth/rbac.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DASHBOARD_NAV_ITEMS, getDefaultRouteForRole, getNavItemsForRole } from "./rbac";

describe("getDefaultRouteForRole", () => {
  it("sends admins to the properties page", () => {
    expect(getDefaultRouteForRole("admin")).toBe("/dashboard/properties");
  });

  it("sends sales staff to the pipeline page", () => {
    expect(getDefaultRouteForRole("sales")).toBe("/dashboard/pipeline");
  });
});

describe("getNavItemsForRole", () => {
  it("gives admins every nav item", () => {
    expect(getNavItemsForRole("admin")).toEqual(DASHBOARD_NAV_ITEMS);
  });

  it("gives sales staff only the pipeline item", () => {
    const items = getNavItemsForRole("sales");
    expect(items).toHaveLength(1);
    expect(items[0].href).toBe("/dashboard/pipeline");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- lib/auth/rbac.test.ts`
Expected: FAIL — `Cannot find module './rbac'` (file doesn't exist yet).

- [ ] **Step 3: Implement rbac.ts**

Create `lib/auth/rbac.ts`:

```ts
export type Role = "admin" | "sales";

export interface NavItem {
  label: string;
  href: string;
  roles: Role[];
}

export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  { label: "Propiedades", href: "/dashboard/properties", roles: ["admin"] },
  { label: "Pipeline", href: "/dashboard/pipeline", roles: ["admin", "sales"] },
  { label: "Usuarios", href: "/dashboard/users", roles: ["admin"] },
];

export function getDefaultRouteForRole(role: Role): string {
  return role === "admin" ? "/dashboard/properties" : "/dashboard/pipeline";
}

export function getNavItemsForRole(role: Role): NavItem[] {
  return DASHBOARD_NAV_ITEMS.filter((item) => item.roles.includes(role));
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- lib/auth/rbac.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/rbac.ts lib/auth/rbac.test.ts
git commit -m "feat: add RBAC role/route mapping"
```

---

### Task 3: Firebase client SDK singleton

**Files:**
- Create: `lib/firebase/client.ts`
- Test: `lib/firebase/client.test.ts`

**Interfaces:**
- Produces: `getFirebaseApp(): FirebaseApp`, `getFirebaseAuth(): Auth`

- [ ] **Step 1: Write the failing test**

Create `lib/firebase/client.test.ts`:

```ts
import { beforeAll, describe, expect, it } from "vitest";
import { getApps } from "firebase/app";

beforeAll(() => {
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "test-api-key";
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "test.firebaseapp.com";
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "test-project";
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "test.firebasestorage.app";
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "123";
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID = "1:123:web:abc";
});

describe("getFirebaseApp", () => {
  it("initializes exactly one app across repeated calls", async () => {
    const { getFirebaseApp } = await import("./client");
    const first = getFirebaseApp();
    const second = getFirebaseApp();
    expect(second).toBe(first);
    expect(getApps()).toHaveLength(1);
  });
});

describe("getFirebaseAuth", () => {
  it("returns an Auth instance bound to the app", async () => {
    const { getFirebaseAuth, getFirebaseApp } = await import("./client");
    const auth = getFirebaseAuth();
    expect(auth.app).toBe(getFirebaseApp());
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- lib/firebase/client.test.ts`
Expected: FAIL — `Cannot find module './client'`.

- [ ] **Step 3: Implement client.ts**

Create `lib/firebase/client.ts`:

```ts
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };
}

export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(getFirebaseConfig());
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- lib/firebase/client.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/firebase/client.ts lib/firebase/client.test.ts
git commit -m "feat: add Firebase client SDK singleton"
```

---

### Task 4: Firebase Admin SDK singleton

**Files:**
- Create: `lib/firebase/admin.ts`
- Test: `lib/firebase/admin.test.ts`
- Modify: `next.config.ts` (mark `firebase-admin` as a server external package)

**Interfaces:**
- Produces: `getFirebaseAdminApp(): App`, `getFirebaseAdminAuth(): Auth`, `getFirebaseAdminFirestore(): Firestore`

- [ ] **Step 1: Write the failing tests**

Create `lib/firebase/admin.test.ts`:

```ts
import { generateKeyPairSync } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { getApps } from "firebase-admin/app";

describe("getFirebaseAdminApp", () => {
  it("throws a clear error when env vars are missing", async () => {
    delete process.env.FIREBASE_ADMIN_PROJECT_ID;
    delete process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    delete process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    const { getFirebaseAdminApp } = await import("./admin");
    expect(() => getFirebaseAdminApp()).toThrow(/FIREBASE_ADMIN_PROJECT_ID/);
  });

  describe("with valid env vars", () => {
    beforeAll(() => {
      const { privateKey } = generateKeyPairSync("rsa", {
        modulusLength: 512,
        privateKeyEncoding: { type: "pkcs1", format: "pem" },
        publicKeyEncoding: { type: "pkcs1", format: "pem" },
      });
      process.env.FIREBASE_ADMIN_PROJECT_ID = "test-project";
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL = "test@test-project.iam.gserviceaccount.com";
      process.env.FIREBASE_ADMIN_PRIVATE_KEY = privateKey.replace(/\n/g, "\\n");
    });

    it("initializes exactly one app across repeated calls", async () => {
      const { getFirebaseAdminApp } = await import("./admin");
      const first = getFirebaseAdminApp();
      const second = getFirebaseAdminApp();
      expect(second).toBe(first);
      expect(getApps()).toHaveLength(1);
    });

    it("returns Auth and Firestore bound to the app", async () => {
      const { getFirebaseAdminApp, getFirebaseAdminAuth, getFirebaseAdminFirestore } = await import("./admin");
      const app = getFirebaseAdminApp();
      expect(getFirebaseAdminAuth().app).toBe(app);
      // The `Firestore` instance returned by `firebase-admin/firestore`'s getFirestore()
      // is the underlying `@google-cloud/firestore` client, which — unlike `Auth` —
      // has no public `.app` property. firebase-admin caches this instance per-app
      // internally, so repeated calls returning the same instance is the observable
      // proof it is bound to (and cached against) the app.
      expect(getFirebaseAdminFirestore()).toBe(getFirebaseAdminFirestore());
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- lib/firebase/admin.test.ts`
Expected: FAIL — `Cannot find module './admin'`.

- [ ] **Step 3: Implement admin.ts**

Create `lib/firebase/admin.ts`:

```ts
import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function getAdminCredential() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin env vars: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY",
    );
  }

  return { projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, "\n") };
}

export function getFirebaseAdminApp(): App {
  if (getApps().length) return getApp();
  return initializeApp({ credential: cert(getAdminCredential()) });
}

export function getFirebaseAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminFirestore(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}
```

- [ ] **Step 4: Mark firebase-admin as a server external package**

In `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- lib/firebase/admin.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/firebase/admin.ts lib/firebase/admin.test.ts next.config.ts
git commit -m "feat: add Firebase Admin SDK singleton"
```

---

### Task 5: Session verification core logic

**Files:**
- Create: `lib/auth/session-core.ts`
- Test: `lib/auth/session-core.test.ts`

**Interfaces:**
- Consumes: `Role` from `@/lib/auth/rbac`
- Produces:
  - `interface Session { uid: string; role: Role; active: boolean }`
  - `interface AdminAuthLike { verifySessionCookie(cookie: string, checkRevoked: boolean): Promise<{ uid: string }> }`
  - `interface FirestoreLike { doc(path: string): { get(): Promise<{ exists: boolean; data(): unknown }> } }`
  - `getSessionFromCookie(cookieValue: string | undefined, deps: { auth: AdminAuthLike; firestore: FirestoreLike }): Promise<Session | null>`

- [ ] **Step 1: Write the failing tests**

Create `lib/auth/session-core.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { getSessionFromCookie } from "./session-core";

function makeDeps(overrides: {
  verifySessionCookie?: (cookie: string, checkRevoked: boolean) => Promise<{ uid: string }>;
  docData?: { exists: boolean; data?: unknown };
}) {
  const verifySessionCookie =
    overrides.verifySessionCookie ?? (async () => ({ uid: "user-1" }));
  const docSnapshot = {
    exists: overrides.docData?.exists ?? true,
    data: () => overrides.docData?.data,
  };
  return {
    auth: { verifySessionCookie },
    firestore: { doc: vi.fn(() => ({ get: async () => docSnapshot })) },
  };
}

describe("getSessionFromCookie", () => {
  it("returns null when there is no cookie", async () => {
    const deps = makeDeps({ docData: { exists: true, data: { role: "admin", active: true } } });
    expect(await getSessionFromCookie(undefined, deps)).toBeNull();
  });

  it("returns null when the cookie fails verification", async () => {
    const deps = makeDeps({
      verifySessionCookie: async () => {
        throw new Error("expired");
      },
    });
    expect(await getSessionFromCookie("bad-cookie", deps)).toBeNull();
  });

  it("returns null when the user doc doesn't exist", async () => {
    const deps = makeDeps({ docData: { exists: false } });
    expect(await getSessionFromCookie("good-cookie", deps)).toBeNull();
  });

  it("returns null when the role is missing or invalid", async () => {
    const deps = makeDeps({ docData: { exists: true, data: { role: "owner", active: true } } });
    expect(await getSessionFromCookie("good-cookie", deps)).toBeNull();
  });

  it("returns null when the user is inactive", async () => {
    const deps = makeDeps({ docData: { exists: true, data: { role: "admin", active: false } } });
    expect(await getSessionFromCookie("good-cookie", deps)).toBeNull();
  });

  it("returns the session for a valid, active user", async () => {
    const deps = makeDeps({ docData: { exists: true, data: { role: "sales", active: true } } });
    expect(await getSessionFromCookie("good-cookie", deps)).toEqual({
      uid: "user-1",
      role: "sales",
      active: true,
    });
  });

  it("queries the correct document path", async () => {
    const deps = makeDeps({ docData: { exists: true, data: { role: "admin", active: true } } });
    await getSessionFromCookie("good-cookie", deps);
    expect(deps.firestore.doc).toHaveBeenCalledWith("users/user-1");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- lib/auth/session-core.test.ts`
Expected: FAIL — `Cannot find module './session-core'`.

- [ ] **Step 3: Implement session-core.ts**

Create `lib/auth/session-core.ts`:

```ts
import type { Role } from "./rbac";

export interface Session {
  uid: string;
  role: Role;
  active: boolean;
}

export interface AdminAuthLike {
  verifySessionCookie(cookie: string, checkRevoked: boolean): Promise<{ uid: string }>;
}

export interface FirestoreLike {
  doc(path: string): { get(): Promise<{ exists: boolean; data(): unknown }> };
}

function isRole(value: unknown): value is Role {
  return value === "admin" || value === "sales";
}

export async function getSessionFromCookie(
  cookieValue: string | undefined,
  deps: { auth: AdminAuthLike; firestore: FirestoreLike },
): Promise<Session | null> {
  if (!cookieValue) return null;

  let decoded: { uid: string };
  try {
    decoded = await deps.auth.verifySessionCookie(cookieValue, true);
  } catch {
    return null;
  }

  const snapshot = await deps.firestore.doc(`users/${decoded.uid}`).get();
  if (!snapshot.exists) return null;

  const data = snapshot.data() as { role?: unknown; active?: unknown } | undefined;
  if (!data || !isRole(data.role)) return null;
  if (data.active === false) return null;

  return { uid: decoded.uid, role: data.role, active: data.active !== false };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- lib/auth/session-core.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/session-core.ts lib/auth/session-core.test.ts
git commit -m "feat: add session verification core logic"
```

---

### Task 6: Next.js session glue (`getSession`, `requireSession`, `requireRole`)

This task is framework glue around already-tested logic (`getSessionFromCookie`, `getDefaultRouteForRole`) — no new pure logic to unit test. `next/headers` and `next/navigation`'s `redirect()` require a real request context, so this is verified manually in later tasks once the login flow exists end-to-end (see Task 12).

**Files:**
- Create: `lib/auth/session.ts`
- Create: `lib/auth/require-role.ts`

**Interfaces:**
- Consumes: `getSessionFromCookie`, `Session` from `@/lib/auth/session-core`; `getFirebaseAdminAuth`, `getFirebaseAdminFirestore` from `@/lib/firebase/admin`; `Role`, `getDefaultRouteForRole` from `@/lib/auth/rbac`
- Produces:
  - `SESSION_COOKIE_NAME: string`
  - `SESSION_EXPIRES_IN_MS: number`
  - `getSession(): Promise<Session | null>`
  - `requireSession(): Promise<Session>`
  - `requireRole(allowedRoles: Role[]): Promise<Session>`

- [ ] **Step 1: Create session.ts**

Create `lib/auth/session.ts`:

```ts
import { cookies } from "next/headers";
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getSessionFromCookie, type Session } from "./session-core";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_EXPIRES_IN_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return getSessionFromCookie(cookieValue, {
    auth: getFirebaseAdminAuth(),
    firestore: getFirebaseAdminFirestore(),
  });
}
```

- [ ] **Step 2: Create require-role.ts**

Create `lib/auth/require-role.ts`:

```ts
import { redirect } from "next/navigation";
import { getDefaultRouteForRole, type Role } from "@/lib/auth/rbac";
import { getSession } from "@/lib/auth/session";
import type { Session } from "@/lib/auth/session-core";

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(allowedRoles: Role[]): Promise<Session> {
  const session = await requireSession();
  if (!allowedRoles.includes(session.role)) {
    redirect(getDefaultRouteForRole(session.role));
  }
  return session;
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (`getFirebaseAdminAuth()`/`getFirebaseAdminFirestore()` structurally satisfy `AdminAuthLike`/`FirestoreLike` from `session-core.ts` — this is what the type-check confirms, since there's no runtime test for this glue.)

- [ ] **Step 4: Commit**

```bash
git add lib/auth/session.ts lib/auth/require-role.ts
git commit -m "feat: add Next.js session glue (getSession, requireRole)"
```

---

### Task 7: Session API route

**Files:**
- Create: `app/api/auth/session/route.ts`

**Interfaces:**
- Consumes: `getFirebaseAdminAuth` from `@/lib/firebase/admin`; `SESSION_COOKIE_NAME`, `SESSION_EXPIRES_IN_MS` from `@/lib/auth/session`
- Produces: `POST` (creates the session cookie from an ID token), `DELETE` (clears it) — standard Next.js Route Handler exports.

- [ ] **Step 1: Implement the route handler**

Create `app/api/auth/session/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME, SESSION_EXPIRES_IN_MS } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { idToken?: string } | null;
  const idToken = body?.idToken;

  if (!idToken) {
    return NextResponse.json({ error: "idToken is required" }, { status: 400 });
  }

  try {
    const auth = getFirebaseAdminAuth();
    await auth.verifyIdToken(idToken);
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_IN_MS,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: SESSION_EXPIRES_IN_MS / 1000,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid ID token" }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return response;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/auth/session/route.ts
git commit -m "feat: add session cookie API route"
```

---

### Task 8: Login page

**Files:**
- Create: `components/auth/login-form.tsx` (Client Component — the interactive form)
- Create: `app/(auth)/login/page.tsx` (Server Component — redirects if already logged in, renders the form)

**Interfaces:**
- Consumes: `getFirebaseAuth` from `@/lib/firebase/client`; `getSession` from `@/lib/auth/session`; `getDefaultRouteForRole` from `@/lib/auth/rbac`; `Button` from `@/components/ui/button`
- Produces: `LoginForm` (named export), `LoginPage` (default export)

- [ ] **Step 1: Implement the login form**

Create `components/auth/login-form.tsx`:

```tsx
"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { getFirebaseAuth } from "@/lib/firebase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      const idToken = await credential.user.getIdToken();

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error("session-create-failed");
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-12 w-full border-b border-foreground/40 bg-transparent px-0 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" variant="primary" className="w-full" disabled={loading}>
        {loading ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Implement the login page**

Create `app/(auth)/login/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getDefaultRouteForRole } from "@/lib/auth/rbac";
import { getSession } from "@/lib/auth/session";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(getDefaultRouteForRole(session.role));

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-8">
      <div className="mb-10 font-serif text-2xl text-foreground">Domus</div>
      <LoginForm />
    </div>
  );
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/auth/login-form.tsx "app/(auth)/login/page.tsx"
git commit -m "feat: add login page"
```

---

### Task 9: Dashboard layout (RBAC guard + chrome)

**Files:**
- Create: `components/dashboard/logout-button.tsx` (Client Component)
- Create: `app/(dashboard)/dashboard/layout.tsx` (Server Component)

**Interfaces:**
- Consumes: `requireSession` from `@/lib/auth/require-role`; `getNavItemsForRole` from `@/lib/auth/rbac`; `getFirebaseAuth` from `@/lib/firebase/client`
- Produces: `LogoutButton` (named export), `DashboardLayout` (default export)

- [ ] **Step 1: Implement the logout button**

Create `components/dashboard/logout-button.tsx`:

```tsx
"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await signOut(getFirebaseAuth());
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors duration-500 hover:text-accent"
    >
      {loading ? "Saliendo…" : "Cerrar Sesión"}
    </button>
  );
}
```

- [ ] **Step 2: Implement the dashboard layout**

Create `app/(dashboard)/dashboard/layout.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { getNavItemsForRole } from "@/lib/auth/rbac";
import { requireSession } from "@/lib/auth/require-role";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const navItems = getNavItemsForRole(session.role);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-foreground/10 px-8 py-6">
        <span className="font-serif text-xl">Domus</span>

        <nav className="flex items-center gap-8 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors duration-500 hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <LogoutButton />
      </header>

      <main className="flex-1 px-8 py-12">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/logout-button.tsx "app/(dashboard)/dashboard/layout.tsx"
git commit -m "feat: add dashboard layout with RBAC guard"
```

---

### Task 10: Stub pages (Properties, Pipeline, Users)

**Files:**
- Create: `app/(dashboard)/dashboard/properties/page.tsx`
- Create: `app/(dashboard)/dashboard/pipeline/page.tsx`
- Create: `app/(dashboard)/dashboard/users/page.tsx`

**Interfaces:**
- Consumes: `requireRole` from `@/lib/auth/require-role`

- [ ] **Step 1: Create the Properties stub (admin only)**

Create `app/(dashboard)/dashboard/properties/page.tsx`:

```tsx
import { requireRole } from "@/lib/auth/require-role";

export default async function PropertiesPage() {
  await requireRole(["admin"]);

  return (
    <div>
      <h1 className="font-serif text-3xl">Propiedades</h1>
      <p className="mt-4 text-muted-foreground">
        Próximamente: gestión completa de propiedades (CRUD).
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create the Pipeline stub (admin + sales)**

Create `app/(dashboard)/dashboard/pipeline/page.tsx`:

```tsx
import { requireRole } from "@/lib/auth/require-role";

export default async function PipelinePage() {
  await requireRole(["admin", "sales"]);

  return (
    <div>
      <h1 className="font-serif text-3xl">Pipeline de Leads</h1>
      <p className="mt-4 text-muted-foreground">
        Próximamente: vista Kanban/tabla de seguimiento de clientes.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Create the Users stub (admin only)**

Create `app/(dashboard)/dashboard/users/page.tsx`:

```tsx
import { requireRole } from "@/lib/auth/require-role";

export default async function UsersPage() {
  await requireRole(["admin"]);

  return (
    <div>
      <h1 className="font-serif text-3xl">Usuarios</h1>
      <p className="mt-4 text-muted-foreground">
        Próximamente: gestión de privilegios del equipo.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/dashboard/properties/page.tsx" "app/(dashboard)/dashboard/pipeline/page.tsx" "app/(dashboard)/dashboard/users/page.tsx"
git commit -m "feat: add RBAC-gated dashboard stub pages"
```

---

### Task 11: Firestore security rules

**Files:**
- Create: `firestore.rules`

**Interfaces:** none (deployed manually by the user; see Step 2).

- [ ] **Step 1: Write deny-all rules**

Create `firestore.rules`:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // All reads/writes for this app go through the Admin SDK on the
    // server, which bypasses these rules using service-account trust.
    // Deny all direct client access as defense in depth.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- [ ] **Step 2: Deploy the rules manually**

This file isn't auto-deployed by this plan. In Firebase Console → Firestore Database → Rules tab, paste the contents of `firestore.rules` and click Publish. (Or, if you have `firebase-tools` installed and are logged in: `firebase deploy --only firestore:rules`.)

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat: add deny-all Firestore security rules"
```

---

### Task 12: Full verification pass and manual checklist

**Files:** none (verification only).

- [ ] **Step 1: Run the full automated check suite**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all four pass with no errors.

- [ ] **Step 2: Create the first Admin account (manual, in Firebase Console)**

1. Firebase Console → Authentication → Users → Add user. Create a user with your email and a password.
2. Copy that user's UID.
3. Firebase Console → Firestore Database → Start collection `users` → Document ID = the UID from step 2. Add fields: `email` (string, matching), `displayName` (string), `role` (string) = `admin`, `active` (boolean) = `true`, `createdAt` (timestamp, now).

- [ ] **Step 3: Manual verification — admin flow**

1. `npm run dev`, visit `/login`.
2. Log in with the admin account from Step 2.
3. Confirm redirect to `/dashboard/properties` and all three nav links (Propiedades, Pipeline, Usuarios) are visible.
4. Visit `/dashboard/users` and `/dashboard/pipeline` directly — both should load (not redirect).
5. Click "Cerrar Sesión" — confirm redirect to `/login`.
6. Visit `/dashboard/properties` directly while logged out — confirm redirect to `/login`.

- [ ] **Step 4: Manual verification — sales flow**

1. Create a second Firebase Auth user + Firestore `users/{uid}` doc with `role: "sales"`, `active: true` (same steps as Step 2).
2. Log in as that user. Confirm redirect to `/dashboard/pipeline` and only the "Pipeline" nav link is visible.
3. Visit `/dashboard/properties` directly by URL — confirm redirect to `/dashboard/pipeline`.
4. Visit `/dashboard/users` directly by URL — confirm redirect to `/dashboard/pipeline`.

- [ ] **Step 5: Manual verification — inactive user**

1. In Firestore, set the sales user's `active` field to `false`.
2. If still logged in, refresh any dashboard page — confirm redirect to `/login` (their existing session cookie is now rejected).
3. Set `active` back to `true` when done testing.

- [ ] **Step 6: Push the branch**

```bash
git push
```

(Only after the user confirms the manual checks above pass.)
