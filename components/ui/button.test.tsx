import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "./button";

describe("Button — prop forwarding", () => {
  it("forwards data-testid to the rendered button", () => {
    render(<Button data-testid="cta-btn">Click</Button>);
    expect(screen.getByTestId("cta-btn")).toBeInTheDocument();
  });

  it("forwards aria-label and aria-describedby", () => {
    render(
      <Button aria-label="Submit form" aria-describedby="helper-text">
        Submit
      </Button>,
    );
    const btn = screen.getByRole("button", { name: "Submit form" });
    expect(btn).toHaveAttribute("aria-describedby", "helper-text");
  });

  it("forwards aria-expanded", () => {
    render(<Button aria-expanded="true">Menu</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });

  it("forwards title attribute", () => {
    render(<Button title="More info">Info</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("title", "More info");
  });

  it("forwards name and value", () => {
    render(
      <Button name="action" value="confirm">
        Confirm
      </Button>,
    );
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("name", "action");
    expect(btn).toHaveAttribute("value", "confirm");
  });

  it("fires onClick handler", () => {
    const handler = vi.fn();
    render(<Button onClick={handler}>Click me</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("renders disabled state correctly", () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn.className).toContain("opacity-60");
  });

  it("defaults type to button", () => {
    render(<Button>Default</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("accepts type=submit", () => {
    render(<Button type="submit">Go</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("applies primary variant classes by default", () => {
    render(<Button>Primary</Button>);
    expect(screen.getByRole("button").className).toContain("bg-accent-500");
  });

  it("applies secondary variant classes", () => {
    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole("button").className).toContain("bg-primary-500/10");
  });

  it("applies sm size class", () => {
    render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button").className).toContain("text-sm");
  });

  it("merges custom className", () => {
    render(<Button className="custom-class">Styled</Button>);
    expect(screen.getByRole("button").className).toContain("custom-class");
    expect(screen.getByRole("button").className).toContain("bg-accent-500");
  });

  // --- Link mode (href) ---

  it("renders an anchor when href is provided", () => {
    render(<Button href="/docs">Docs</Button>);
    const link = screen.getByRole("link", { name: "Docs" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/docs");
  });

  it("forwards data-testid to anchor", () => {
    render(
      <Button href="/about" data-testid="about-link">
        About
      </Button>,
    );
    expect(screen.getByTestId("about-link").tagName).toBe("A");
  });

  it("forwards aria-label to anchor", () => {
    render(
      <Button href="/home" aria-label="Go home">
        Home
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Go home" })).toBeInTheDocument();
  });

  it("forwards target and rel to anchor", () => {
    render(
      <Button href="https://example.com" target="_blank" rel="noopener noreferrer">
        External
      </Button>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
