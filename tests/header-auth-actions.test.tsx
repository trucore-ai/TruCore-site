import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockIsLoggedIn = vi.fn();

vi.mock("@/lib/customer-auth", () => ({
  isLoggedIn: () => mockIsLoggedIn(),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { HeaderAuthActions } from "@/components/header-auth-actions";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("HeaderAuthActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Sign In and Sign Up when logged out", () => {
    mockIsLoggedIn.mockReturnValue(false);
    render(<HeaderAuthActions />);

    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();

    expect(screen.getByText("Sign In").closest("a")).toHaveAttribute("href", "/login");
    expect(screen.getByText("Sign Up").closest("a")).toHaveAttribute("href", "/signup");
  });

  it("renders Dashboard when logged in", () => {
    mockIsLoggedIn.mockReturnValue(true);
    render(<HeaderAuthActions />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Sign In")).not.toBeInTheDocument();
    expect(screen.queryByText("Sign Up")).not.toBeInTheDocument();

    expect(screen.getByText("Dashboard").closest("a")).toHaveAttribute(
      "href",
      "/customer/dashboard",
    );
  });

  it("renders Policies link when logged in", () => {
    mockIsLoggedIn.mockReturnValue(true);
    render(<HeaderAuthActions />);

    const policiesLink = screen.getByText("Policies");
    expect(policiesLink).toBeInTheDocument();
    expect(policiesLink.closest("a")).toHaveAttribute("href", "/customer/policies");
  });

  it("renders nothing during SSR (isLoggedIn returns null)", () => {
    mockIsLoggedIn.mockReturnValue(null);
    const { container } = render(<HeaderAuthActions />);
    expect(container.innerHTML).toBe("");
  });
});
