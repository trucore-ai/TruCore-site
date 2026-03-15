import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAssertAdminSession = vi.fn();
vi.mock("@/lib/admin-auth", () => ({
  assertAdminSession: (...args: unknown[]) =>
    mockAssertAdminSession(...args),
}));

const mockLogSecurityEvent = vi.fn();
vi.mock("@/lib/security-log", () => ({
  logSecurityEvent: (...args: unknown[]) => mockLogSecurityEvent(...args),
}));

import { withAdminAction } from "./admin-action-auth";

describe("withAdminAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns { error: 'unauthorized' } when session is invalid", async () => {
    mockAssertAdminSession.mockRejectedValue(new Error("unauthorized"));

    const result = await withAdminAction(async () => ({ ok: true }));
    expect(result).toEqual({ error: "unauthorized" });
    expect(mockLogSecurityEvent).toHaveBeenCalledWith("admin_action_denied");
  });

  it("executes fn and returns result when session is valid", async () => {
    mockAssertAdminSession.mockResolvedValue(undefined);

    const result = await withAdminAction(async () => ({
      ok: true,
      data: "test",
    }));
    expect(result).toEqual({ ok: true, data: "test" });
    expect(mockLogSecurityEvent).not.toHaveBeenCalled();
  });

  it("does not catch errors thrown inside fn", async () => {
    mockAssertAdminSession.mockResolvedValue(undefined);

    await expect(
      withAdminAction(async () => {
        throw new Error("business logic error");
      }),
    ).rejects.toThrow("business logic error");
  });
});
