import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetAdminSession = vi.fn();
vi.mock("@/lib/admin-auth", () => ({
  getAdminSessionFromCookies: (...args: unknown[]) =>
    mockGetAdminSession(...args),
}));

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("NEXT_REDIRECT");
  },
}));

import AdminLayout from "./layout";

describe("AdminLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /admin/login when session is invalid", async () => {
    mockGetAdminSession.mockResolvedValue(false);

    await expect(
      AdminLayout({ children: null }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
  });

  it("renders children when session is valid", async () => {
    mockGetAdminSession.mockResolvedValue(true);

    const result = await AdminLayout({
      children: "test content" as unknown as React.ReactNode,
    });
    expect(result).toBeTruthy();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
