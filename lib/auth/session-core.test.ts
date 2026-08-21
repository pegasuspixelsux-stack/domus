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

  it("accepts the manager role", async () => {
    const deps = makeDeps({ docData: { exists: true, data: { role: "manager", active: true } } });
    expect(await getSessionFromCookie("good-cookie", deps)).toEqual({
      uid: "user-1",
      role: "manager",
      active: true,
    });
  });

  it("queries the correct document path", async () => {
    const deps = makeDeps({ docData: { exists: true, data: { role: "admin", active: true } } });
    await getSessionFromCookie("good-cookie", deps);
    expect(deps.firestore.doc).toHaveBeenCalledWith("users/user-1");
  });
});
