import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

const mockFetchCustomerKeys = vi.fn();
const mockCreateCustomerKey = vi.fn();
const mockRevokeCustomerKey = vi.fn();
const mockRotateCustomerKey = vi.fn();

vi.mock("@/lib/customer-auth", () => {
  class ApiError extends Error {
    code: string;
    retryAfterSeconds?: number;
    constructor(code: string, message: string, retryAfterSeconds?: number) {
      super(message);
      this.name = "ApiError";
      this.code = code;
      this.retryAfterSeconds = retryAfterSeconds;
    }
  }
  return {
    isLoggedIn: () => true,
    clearAuth: vi.fn(),
    fetchCustomerKeys: (...args: unknown[]) => mockFetchCustomerKeys(...args),
    createCustomerKey: (...args: unknown[]) => mockCreateCustomerKey(...args),
    revokeCustomerKey: (...args: unknown[]) => mockRevokeCustomerKey(...args),
    rotateCustomerKey: (...args: unknown[]) => mockRotateCustomerKey(...args),
    ApiError,
  };
});

import CustomerKeysPage from "@/app/customer/keys/page";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const KEYS_LIST_RESPONSE = {
  keys: [
    {
      key_id: "atf_key_001",
      label: "prod-bot",
      status: "active",
      created_at: 1710000000,
      last_used_at: 1710003600,
      preview: "atf_sk_****abcd",
      scopes: ["atf:probe", "atf:mcp"],
      purpose: "mcp",
    },
    {
      key_id: "atf_key_002",
      label: "test-api",
      status: "active",
      created_at: 1710000000,
      last_used_at: null,
      preview: "atf_sk_****efgh",
      scopes: [],
      purpose: "api",
    },
  ],
  count: 2,
  plan_tier: "pro",
  allowed_scopes: [
    "atf:probe",
    "atf:protect",
    "atf:simulate",
    "atf:verify",
    "atf:explain",
    "atf:mcp",
  ],
  mcp_endpoint: "https://api.trucore.xyz/mcp/v1",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CustomerKeysPage – scoped credentials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchCustomerKeys.mockResolvedValue(KEYS_LIST_RESPONSE);
  });

  it("renders plan tier info", async () => {
    render(<CustomerKeysPage />);
    await waitFor(() => {
      // Plan tier appears as "Plan: Pro."
      expect(screen.getByText(/Plan:/)).toBeTruthy();
    });
  });

  it("renders scope badges on keys with explicit scopes", async () => {
    render(<CustomerKeysPage />);
    await waitFor(() => {
      // atf:probe appears both in key row badge and plan info
      const probeElems = screen.getAllByText("atf:probe");
      expect(probeElems.length).toBeGreaterThanOrEqual(1);
      const mcpElems = screen.getAllByText("atf:mcp");
      expect(mcpElems.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders 'all' for keys without explicit scopes", async () => {
    render(<CustomerKeysPage />);
    await waitFor(() => {
      expect(screen.getByText("all")).toBeTruthy();
    });
  });

  it("renders purpose column header", async () => {
    render(<CustomerKeysPage />);
    await waitFor(() => {
      expect(screen.getByText("Purpose")).toBeTruthy();
    });
  });

  it("renders MCP endpoint section", async () => {
    render(<CustomerKeysPage />);
    await waitFor(() => {
      expect(screen.getByText("MCP Integration")).toBeTruthy();
      // MCP endpoint now appears in both the MCP section and quickstart panel
      expect(
        screen.getAllByText("https://api.trucore.xyz/mcp/v1").length,
      ).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows scope checkboxes when creating a key", async () => {
    render(<CustomerKeysPage />);
    await waitFor(() => {
      expect(screen.getByText("Create API Key")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("Create API Key"));

    // Wait for scope checkboxes — scopes also appear in plan info footer,
    // so use getAllByText
    await waitFor(() => {
      expect(screen.getAllByText("atf:protect").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("atf:simulate").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows purpose selector when creating a key", async () => {
    render(<CustomerKeysPage />);
    await waitFor(() => {
      expect(screen.getByText("Create API Key")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("Create API Key"));

    await waitFor(() => {
      expect(screen.getByText("General")).toBeTruthy();
      expect(screen.getByText("REST API")).toBeTruthy();
      expect(screen.getByText("Bot / Agent")).toBeTruthy();
    });
  });

  it("passes scopes and purpose to createCustomerKey", async () => {
    mockCreateCustomerKey.mockResolvedValue({
      key_id: "atf_key_new",
      label: "test",
      status: "active",
      created_at: 1710000000,
      preview: "atf_sk_****wxyz",
      raw_secret: "atf_sk_secret_value_here",
      scopes: ["atf:probe", "atf:mcp"],
      purpose: "mcp",
    });

    render(<CustomerKeysPage />);
    await waitFor(() => {
      expect(screen.getByText("Create API Key")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("Create API Key"));

    // Wait for purpose buttons to appear
    await waitFor(() => {
      expect(screen.getByText("General")).toBeTruthy();
    });

    // Find and click the "MCP Integration" purpose button
    const purposeButtons = screen.getAllByRole("button");
    const mcpPurposeBtn = purposeButtons.find(
      (btn) => btn.textContent === "MCP Integration",
    );
    expect(mcpPurposeBtn).toBeTruthy();
    fireEvent.click(mcpPurposeBtn!);

    // Click Create
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(mockCreateCustomerKey).toHaveBeenCalledWith(
        "", // label
        [], // scopes (none selected)
        "mcp", // purpose
      );
    });
  });

  it("hides MCP section when no mcp_endpoint", async () => {
    mockFetchCustomerKeys.mockResolvedValue({
      keys: [],
      count: 0,
      plan_tier: "free",
      allowed_scopes: ["atf:probe", "atf:verify", "atf:explain"],
    });

    render(<CustomerKeysPage />);
    await waitFor(() => {
      expect(screen.queryByText("MCP Integration")).toBeNull();
    });
  });

  it("table headers include Purpose and Scopes", async () => {
    render(<CustomerKeysPage />);
    await waitFor(() => {
      expect(screen.getByText("Purpose")).toBeTruthy();
      expect(screen.getByText("Scopes")).toBeTruthy();
    });
  });

  // -----------------------------------------------------------------------
  // revoked_at visibility
  // -----------------------------------------------------------------------

  it("shows revoked_at timestamp for revoked keys", async () => {
    mockFetchCustomerKeys.mockResolvedValue({
      keys: [
        {
          key_id: "atf_key_revoked",
          label: "old-key",
          status: "revoked",
          created_at: 1710000000,
          last_used_at: 1710003600,
          preview: "atf_sk_****zzzz",
          scopes: ["atf:probe"],
          purpose: "api",
          revoked_at: 1710100000,
        },
      ],
      count: 1,
      plan_tier: "pro",
      allowed_scopes: ["atf:probe"],
    });

    render(<CustomerKeysPage />);
    await waitFor(() => {
      expect(screen.getByText("revoked")).toBeTruthy();
      // revoked_at timestamp should render (Mar 11, 2024)
      expect(screen.getByText(/Mar 1[01], 2024/)).toBeTruthy();
    });
  });

  it("does not show revoked_at text for active keys", async () => {
    render(<CustomerKeysPage />);
    await waitFor(() => {
      expect(screen.getAllByText("active").length).toBeGreaterThanOrEqual(1);
    });
    // The default fixture has only active keys — no revoked_at timestamp
    // should appear anywhere (no "revoked" badge text)
    expect(screen.queryByText("revoked")).toBeNull();
  });

  it("shows revoked badge without timestamp when revoked_at is absent", async () => {
    mockFetchCustomerKeys.mockResolvedValue({
      keys: [
        {
          key_id: "atf_key_revoked_no_ts",
          label: "legacy-key",
          status: "revoked",
          created_at: 1710000000,
          preview: "atf_sk_****yyyy",
          scopes: [],
          purpose: "",
        },
      ],
      count: 1,
      plan_tier: "free",
      allowed_scopes: [],
    });

    render(<CustomerKeysPage />);
    await waitFor(() => {
      // The revoked badge should exist but its parent status cell should
      // contain only "revoked" with no additional timestamp text.
      const badge = screen.getByText("revoked");
      const statusCell = badge.closest("td");
      expect(statusCell).toBeTruthy();
      expect(statusCell!.textContent?.trim()).toBe("revoked");
    });
  });
});

// ---------------------------------------------------------------------------
// Bot-friendly quickstart (Phase 89)
// ---------------------------------------------------------------------------

describe("CustomerKeysPage - bot credential quickstart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchCustomerKeys.mockResolvedValue(KEYS_LIST_RESPONSE);
  });

  it("renders 'Create test key' preset button", async () => {
    render(<CustomerKeysPage />);
    await waitFor(() => {
      expect(screen.getByTestId("create-test-key-preset")).toBeTruthy();
    });
  });

  it("preset prefills label, scopes, and purpose on click", async () => {
    render(<CustomerKeysPage />);
    await waitFor(() => {
      expect(screen.getByTestId("create-test-key-preset")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("create-test-key-preset"));

    await waitFor(() => {
      // Label input should be prefilled with "test-bot"
      const labelInput = screen.getByPlaceholderText("e.g. production-bot") as HTMLInputElement;
      expect(labelInput.value).toBe("test-bot");
      // Bot / Agent purpose should be selected (highlighted)
      const purposeButtons = screen.getAllByRole("button");
      const botBtn = purposeButtons.find((b) => b.textContent === "Bot / Agent");
      expect(botBtn).toBeTruthy();
      expect(botBtn!.className).toContain("border-primary-400");
    });
  });

  it("renders quickstart panel with connection info", async () => {
    render(<CustomerKeysPage />);
    await waitFor(() => {
      expect(screen.getByTestId("quickstart-panel")).toBeTruthy();
      expect(screen.getByText("How to use this key")).toBeTruthy();
    });
  });

  it("shows API base URL in quickstart panel", async () => {
    render(<CustomerKeysPage />);
    await waitFor(() => {
      expect(screen.getByText("https://api.trucore.xyz")).toBeTruthy();
    });
  });

  it("shows MCP endpoint URL in quickstart panel", async () => {
    render(<CustomerKeysPage />);
    await waitFor(() => {
      expect(screen.getByText("https://api.trucore.xyz/mcp/v1")).toBeTruthy();
    });
  });

  it("shows auth header name in quickstart panel", async () => {
    render(<CustomerKeysPage />);
    await waitFor(() => {
      expect(screen.getByText("X-API-Key")).toBeTruthy();
    });
  });

  it("shows secret shown-once warning in quickstart panel", async () => {
    render(<CustomerKeysPage />);
    await waitFor(() => {
      expect(screen.getByText(/shown once only/i)).toBeTruthy();
    });
  });

  it("shows recommended scopes for API/CLI test", async () => {
    render(<CustomerKeysPage />);
    await waitFor(() => {
      expect(screen.getByText("API / CLI test")).toBeTruthy();
    });
  });

  it("shows recommended scopes for MCP test", async () => {
    render(<CustomerKeysPage />);
    await waitFor(() => {
      expect(screen.getByText("MCP test")).toBeTruthy();
    });
  });

  it("renders copy-ready snippet blocks", async () => {
    render(<CustomerKeysPage />);
    await waitFor(() => {
      expect(screen.getByText(/copy-ready snippets/i)).toBeTruthy();
    });
  });

  it("secret shown-once warning still present on create", async () => {
    mockCreateCustomerKey.mockResolvedValue({
      key_id: "atf_key_new",
      label: "test-bot",
      status: "active",
      created_at: 1710000000,
      preview: "atf_sk_****wxyz",
      raw_secret: "atf_sk_secret_value_quickstart",
      scopes: ["atf:probe", "atf:simulate", "atf:verify", "atf:explain"],
      purpose: "bot",
    });

    render(<CustomerKeysPage />);
    await waitFor(() => {
      expect(screen.getByTestId("create-test-key-preset")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("create-test-key-preset"));

    await waitFor(() => {
      expect(screen.getByText("Create")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(screen.getByText("New Secret API Key Created")).toBeTruthy();
      expect(
        screen.getByText(/It will only be shown once/),
      ).toBeTruthy();
    });
  });
});
