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
