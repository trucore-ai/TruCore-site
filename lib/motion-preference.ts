export const MOTION_PREFERENCE_STORAGE_KEY = "trucore.motionPreference";

/**
 * Motion preference:
 * - "system" (default) = animations OFF (calm, professional default)
 * - "enable" = user explicitly opted in to animations
 * - "reduce" = legacy value, treated same as "system"
 */
export type MotionPreference = "system" | "enable" | "reduce";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type ResolveReducedMotionInput = {
  storedPreference: MotionPreference;
  systemReduced: boolean;
};

export function parseMotionPreference(rawValue: string | null | undefined): MotionPreference {
  if (rawValue === "enable") return "enable";
  if (rawValue === "reduce") return "reduce";
  return "system";
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

/**
 * Animations are OFF by default. Only enabled when user explicitly opts in
 * via the toggle (stored preference === "enable") AND the OS does not
 * enforce reduced motion.
 */
export function resolveReducedMotion({ storedPreference, systemReduced }: ResolveReducedMotionInput): boolean {
  // OS-level reduced motion always wins
  if (systemReduced) {
    return true;
  }

  // Only enable animations when user explicitly opted in
  if (storedPreference === "enable") {
    return false;
  }

  // Default: animations off
  return true;
}
