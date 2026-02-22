import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const cookieValues = new Map<string, string>();
  const headerValues = new Map<string, string>();

  const cookieStore = {
    get: vi.fn((name: string) => {
      const value = cookieValues.get(name);
      return value === undefined ? undefined : { name, value };
    }),
    set: vi.fn((name: string, value: string) => {
      cookieValues.set(name, String(value));
    }),
  };

  return {
    cookieValues,
    headerValues,
    cookieStore,
    ensureWaitlistTableMock: vi.fn(),
    upsertWaitlistSignupMock: vi.fn(),
    sendAdminNotificationMock: vi.fn(),
    sendUserConfirmationMock: vi.fn(),
    cookiesMock: vi.fn(async () => cookieStore),
    headersMock: vi.fn(async () => ({
      get: (key: string) => headerValues.get(key.toLowerCase()) ?? null,
    })),
  };
});

vi.mock("@/lib/db", () => ({
  ensureWaitlistTable: mocks.ensureWaitlistTableMock,
  upsertWaitlistSignup: mocks.upsertWaitlistSignupMock,
}));

vi.mock("@/lib/email", () => ({
  sendAdminNotification: mocks.sendAdminNotificationMock,
  sendUserConfirmation: mocks.sendUserConfirmationMock,
}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookiesMock,
  headers: mocks.headersMock,
}));

import { joinWaitlist } from "./waitlist";

function buildFormData(fields: Record<string, string | string[] | undefined>): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        formData.append(key, item);
      }
      continue;
    }

    if (value !== undefined) {
      formData.set(key, value);
    }
  }

  return formData;
}

describe("joinWaitlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    mocks.cookieValues.clear();
    mocks.headerValues.clear();
    mocks.headerValues.set("x-forwarded-for", "203.0.113.10");
    mocks.headerValues.set("user-agent", "vitest-agent");

    mocks.ensureWaitlistTableMock.mockResolvedValue(undefined);
    mocks.upsertWaitlistSignupMock.mockResolvedValue({ isNew: true });
    mocks.sendAdminNotificationMock.mockResolvedValue(true);
    mocks.sendUserConfirmationMock.mockResolvedValue(true);

    process.env.DESIGN_PARTNER_SCHEDULING_URL = "https://cal.example.com/trucore";
  });

  it("handles standard signup, persists with standard intent, and sends emails", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-22T12:00:00.000Z"));

    const result = await joinWaitlist(
      buildFormData({
        email: "User@Example.com",
        role: "Builder",
        useCase: "Agent authorization",
        intent: "standard",
      }),
    );

    expect(result).toEqual({
      ok: true,
      message: "You're on the list. We'll share early-access updates soon.",
      intent: "standard",
      schedulingUrl: undefined,
    });

    expect(mocks.ensureWaitlistTableMock).toHaveBeenCalledTimes(1);
    expect(mocks.upsertWaitlistSignupMock).toHaveBeenCalledTimes(1);
    expect(mocks.upsertWaitlistSignupMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "user@example.com",
        role: "Builder",
        useCase: "Agent authorization",
        source: "homepage",
        intent: "standard",
        projectName: null,
        integrationsInterest: null,
        txVolumeBucket: null,
        buildStage: null,
        userAgent: "vitest-agent",
      }),
    );
    expect(mocks.upsertWaitlistSignupMock.mock.calls[0][0].ipHash).toEqual(expect.any(String));

    expect(mocks.sendAdminNotificationMock).toHaveBeenCalledTimes(1);
    expect(mocks.sendAdminNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "user@example.com",
        intent: "standard",
      }),
    );
    expect(mocks.sendUserConfirmationMock).toHaveBeenCalledTimes(1);
    expect(mocks.sendUserConfirmationMock).toHaveBeenCalledWith("user@example.com", "standard");
    expect(mocks.cookieStore.set).toHaveBeenCalledWith(
      "wl_ts",
      String(Date.now()),
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 30,
        path: "/",
      }),
    );
  });

  it("rejects design partner payload when required fields are missing", async () => {
    const result = await joinWaitlist(
      buildFormData({
        email: "partner@example.com",
        intent: "design_partner",
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.message.toLowerCase()).toContain("project or company");
    expect(mocks.ensureWaitlistTableMock).not.toHaveBeenCalled();
    expect(mocks.upsertWaitlistSignupMock).not.toHaveBeenCalled();
    expect(mocks.sendAdminNotificationMock).not.toHaveBeenCalled();
    expect(mocks.sendUserConfirmationMock).not.toHaveBeenCalled();
  });

  it("accepts valid design partner payload and returns scheduling URL", async () => {
    const result = await joinWaitlist(
      buildFormData({
        email: "partner@example.com",
        role: "Founder",
        useCase: "Managed autonomous treasury",
        intent: "design_partner",
        projectName: "Acme Treasury",
        integrationsInterest: ["jupiter", "solend"],
        txVolumeBucket: "100k_1m",
        buildStage: "prototype",
      }),
    );

    expect(result).toEqual({
      ok: true,
      message: "Application received. We'll follow up shortly.",
      intent: "design_partner",
      schedulingUrl: "https://cal.example.com/trucore",
    });

    expect(mocks.upsertWaitlistSignupMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "partner@example.com",
        intent: "design_partner",
        projectName: "Acme Treasury",
        integrationsInterest: ["jupiter", "solend"],
        txVolumeBucket: "100k_1m",
        buildStage: "prototype",
      }),
    );
  });

  it("silently succeeds honeypot submissions without DB or email side effects", async () => {
    const result = await joinWaitlist(
      buildFormData({
        email: "bot@example.com",
        company: "Acme Bot Corp",
      }),
    );

    expect(result).toEqual({
      ok: true,
      message: "You're on the list. We'll share early-access updates soon.",
      intent: "standard",
    });
    expect(mocks.ensureWaitlistTableMock).not.toHaveBeenCalled();
    expect(mocks.upsertWaitlistSignupMock).not.toHaveBeenCalled();
    expect(mocks.sendAdminNotificationMock).not.toHaveBeenCalled();
    expect(mocks.sendUserConfirmationMock).not.toHaveBeenCalled();
  });

  it("keeps signup successful when email sending fails", async () => {
    mocks.sendAdminNotificationMock.mockRejectedValue(new Error("admin email down"));
    mocks.sendUserConfirmationMock.mockRejectedValue(new Error("user email down"));

    const result = await joinWaitlist(
      buildFormData({
        email: "resilient@example.com",
        intent: "standard",
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.intent).toBe("standard");
    expect(mocks.ensureWaitlistTableMock).toHaveBeenCalledTimes(1);
    expect(mocks.upsertWaitlistSignupMock).toHaveBeenCalledTimes(1);
    expect(mocks.sendAdminNotificationMock).toHaveBeenCalledTimes(1);
    expect(mocks.sendUserConfirmationMock).toHaveBeenCalledTimes(1);
  });

  it("blocks submissions during cooldown window", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-22T12:00:30.000Z"));
    mocks.cookieValues.set("wl_ts", String(Date.now() - 10_000));

    const result = await joinWaitlist(
      buildFormData({
        email: "cooldown@example.com",
        intent: "standard",
      }),
    );

    expect(result).toEqual({
      ok: false,
      message: "Please wait a moment before submitting again.",
    });
    expect(mocks.ensureWaitlistTableMock).not.toHaveBeenCalled();
    expect(mocks.upsertWaitlistSignupMock).not.toHaveBeenCalled();
    expect(mocks.sendAdminNotificationMock).not.toHaveBeenCalled();
    expect(mocks.sendUserConfirmationMock).not.toHaveBeenCalled();
  });
});
