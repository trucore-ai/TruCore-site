import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const UTM_COOKIE_NAME = "trucore_utm";
export const UTM_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

const MAX_VALUE_LEN = 120;

export const UTM_QUERY_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

export type UtmField = (typeof UTM_QUERY_KEYS)[number];

export type UtmPayload = Partial<Record<UtmField, string>>;

function sanitizeUtmValue(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_VALUE_LEN);
}

function hasAttribution(payload: UtmPayload): boolean {
  return UTM_QUERY_KEYS.some((key) => {
    const value = payload[key];
    return typeof value === "string" && value.length > 0;
  });
}

export function parseUtmFromUrl(searchParams: URLSearchParams): UtmPayload | null {
  const payload: UtmPayload = {};

  for (const key of UTM_QUERY_KEYS) {
    const value = sanitizeUtmValue(searchParams.get(key));
    if (value) {
      payload[key] = value;
    }
  }

  return hasAttribution(payload) ? payload : null;
}

export function parseUtmCookieValue(rawValue: string | null | undefined): UtmPayload | null {
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const payload: UtmPayload = {};
    for (const key of UTM_QUERY_KEYS) {
      const source = (parsed as Record<string, unknown>)[key];
      if (typeof source !== "string") continue;
      const value = sanitizeUtmValue(source);
      if (value) {
        payload[key] = value;
      }
    }

    return hasAttribution(payload) ? payload : null;
  } catch {
    return null;
  }
}

export async function getUtmFromCookies(): Promise<UtmPayload | null> {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(UTM_COOKIE_NAME)?.value;
  return parseUtmCookieValue(rawValue);
}

export function setUtmCookie(response: NextResponse, utm: UtmPayload): void {
  if (response.cookies.get(UTM_COOKIE_NAME)?.value) {
    return;
  }

  if (!hasAttribution(utm)) {
    return;
  }

  response.cookies.set(UTM_COOKIE_NAME, JSON.stringify(utm), {
    maxAge: UTM_COOKIE_MAX_AGE,
    path: "/",
    httpOnly: false,
    sameSite: "lax",
  });
}
