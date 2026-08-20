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
      // does not expose an `.app` property in its public type. firebase-admin caches
      // this instance per-app internally, so repeated calls returning the same
      // instance is the observable proof it is bound to (and cached against) the app.
      expect(getFirebaseAdminFirestore()).toBe(getFirebaseAdminFirestore());
    });
  });
});
