import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mock Next.js navigation (required for "use client" page)
// ---------------------------------------------------------------------------
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/customer/keys",
  useSearchParams: () => new URLSearchParams(),
}));

// ---------------------------------------------------------------------------
// Mock customer-auth to skip real API calls
// ---------------------------------------------------------------------------
vi.mock("@/lib/customer-auth", () => ({
  isLoggedIn: () => true,
  clearAuth: vi.fn(),
  fetchCustomerKeys: vi.fn().mockResolvedValue({
    keys: [],
    count: 0,
    plan_tier: "free",
    allowed_scopes: ["atf:probe", "atf:verify", "atf:explain"],
    mcp_endpoint: "/mcp/v1",
  }),
  createCustomerKey: vi.fn(),
  revokeCustomerKey: vi.fn(),
  rotateCustomerKey: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
    code: string;
  },
}));

import CustomerKeysPage from "@/app/customer/keys/page";

// ---------------------------------------------------------------------------
// Customer Keys page – canonical bootstrap guidance (Phase 70)
// ---------------------------------------------------------------------------

describe("CustomerKeysPage - bootstrap guidance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders canonical ATF_API_KEY env var", async () => {
    render(<CustomerKeysPage />);
    // The env var name appears in the quickstart panel
    const el = await screen.findByTestId("env-var-name");
    expect(el.textContent).toContain("ATF_API_KEY");
  });

  it("renders canonical secret path", async () => {
    render(<CustomerKeysPage />);
    const el = await screen.findByTestId("env-file-path");
    expect(el.textContent).toContain("~/.openclaw/secrets/atf.env");
  });

  it("renders self-verification steps section", async () => {
    render(<CustomerKeysPage />);
    const el = await screen.findByTestId("verification-steps");
    expect(el).toBeTruthy();
    expect(el.textContent).toContain("API check");
    expect(el.textContent).toContain("MCP check");
    expect(el.textContent).toContain("CLI check");
  });

  it("renders env file snippet with canonical path", async () => {
    render(<CustomerKeysPage />);
    const panel = await screen.findByTestId("quickstart-panel");
    expect(panel.textContent).toContain("~/.openclaw/secrets/atf.env");
  });

  it("does not contradict API/MCP/CLI instructions across surfaces", async () => {
    render(<CustomerKeysPage />);
    const panel = await screen.findByTestId("quickstart-panel");
    const text = panel.textContent || "";
    // Canonical values are consistent
    expect(text).toContain("https://api.trucore.xyz");
    expect(text).toContain("/mcp/v1");
    expect(text).toContain("X-API-Key");
    expect(text).toContain("ATF_API_KEY");
  });
});
