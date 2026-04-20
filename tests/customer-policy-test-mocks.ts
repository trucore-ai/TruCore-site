import { vi } from "vitest";
import {
  mockFetchCohortBenchmarks,
  mockFetchExternalContext,
  mockFetchMarketConditions,
  mockFetchPilRecommendations,
  mockFetchPolicy,
  mockFetchReceiptSummary,
  mockUpdatePolicyOverrides,
} from "./customer-policy-page-testkit";

const mockPush = vi.fn();
const mockReplace = vi.fn();
const stableRouter = { push: mockPush, replace: mockReplace };

vi.mock("next/navigation", () => ({
  useRouter: () => stableRouter,
}));

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
    fetchPolicy: (...args: unknown[]) => mockFetchPolicy(...args),
    updatePolicyOverrides: (...args: unknown[]) => mockUpdatePolicyOverrides(...args),
    fetchReceiptSummary: (...args: unknown[]) => mockFetchReceiptSummary(...args),
    fetchMarketConditions: (...args: unknown[]) => mockFetchMarketConditions(...args),
    fetchPilRecommendations: (...args: unknown[]) => mockFetchPilRecommendations(...args),
    fetchCohortBenchmarks: (...args: unknown[]) => mockFetchCohortBenchmarks(...args),
    fetchExternalContext: (...args: unknown[]) => mockFetchExternalContext(...args),
    ApiError,
  };
});

export { mockReplace };
