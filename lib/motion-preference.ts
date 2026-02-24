export const MOTION_PREFERENCE_STORAGE_KEY = "trucore.motionPreference";

export type MotionPreference = "system" | "reduce";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type ResolveReducedMotionInput = {
  storedPreference: MotionPreference;
  systemReduced: boolean;
};

export function parseMotionPreference(rawValue: string | null | undefined): MotionPreference {
  return rawValue === "reduce" ? "reduce" : "system";
}

export function readStoredMotionPreference(storage: StorageLike | null | undefined): MotionPreference {
  if (!storage) {
    return "system";
  }

  return parseMotionPreference(storage.getItem(MOTION_PREFERENCE_STORAGE_KEY));
}

export function persistMotionPreference(preference: MotionPreference, storage: StorageLike | null | undefined): void {
  if (!storage) {
    return;
  }

  if (preference === "system") {
    storage.removeItem(MOTION_PREFERENCE_STORAGE_KEY);
    return;
  }

  storage.setItem(MOTION_PREFERENCE_STORAGE_KEY, preference);
}

export function resolveReducedMotion({ storedPreference, systemReduced }: ResolveReducedMotionInput): boolean {
  if (storedPreference === "reduce") {
    return true;
  }

  return systemReduced;
}
