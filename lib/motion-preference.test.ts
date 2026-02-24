import { describe, expect, it } from "vitest";
import {
  readStoredMotionPreference,
  resolveReducedMotion,
  type MotionPreference,
} from "@/lib/motion-preference";

type MockStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function createStorage(value: MotionPreference | null): MockStorage {
  const store = new Map<string, string>();

  if (value) {
    store.set("trucore.motionPreference", value);
  }

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, nextValue: string) => {
      store.set(key, nextValue);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
}

describe("motion preference", () => {
  it("defaults to system behavior when no preference is persisted", () => {
    const storage = createStorage(null);
    const preference = readStoredMotionPreference(storage);

    expect(preference).toBe("system");
    expect(
      resolveReducedMotion({
        storedPreference: preference,
        systemReduced: false,
      }),
    ).toBe(false);
    expect(
      resolveReducedMotion({
        storedPreference: preference,
        systemReduced: true,
      }),
    ).toBe(true);
  });

  it("forces reduced motion when explicit preference is persisted", () => {
    const storage = createStorage("reduce");
    const preference = readStoredMotionPreference(storage);

    expect(preference).toBe("reduce");
    expect(
      resolveReducedMotion({
        storedPreference: preference,
        systemReduced: false,
      }),
    ).toBe(true);
  });
});
