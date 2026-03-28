import { describe, expect, it, beforeEach } from "vitest";
import {
  logSecurityEvent,
  getCustomerRouteFailureCounts,
  _resetSecurityEventCounters,
} from "@/lib/security-log";

beforeEach(() => {
  _resetSecurityEventCounters();
});

describe("customer_route_failure logging", () => {
  it("increments counter for known customer route", () => {
    logSecurityEvent("customer_route_failure", {
      meta: {
        route: "sandbox/protect",
        upstream_target: "atf-api",
        failure_class: "upstream_5xx",
        status: 502,
        environment: "test",
      },
    });

    const counts = getCustomerRouteFailureCounts();
    expect(counts["sandbox/protect"]).toBe(1);
  });

  it("increments counter for sample-intent route", () => {
    logSecurityEvent("customer_route_failure", {
      meta: {
        route: "sandbox/sample-intent",
        upstream_target: "atf-api",
        failure_class: "network_error",
        environment: "test",
      },
    });

    const counts = getCustomerRouteFailureCounts();
    expect(counts["sandbox/sample-intent"]).toBe(1);
  });

  it("ignores unknown routes", () => {
    logSecurityEvent("customer_route_failure", {
      meta: {
        route: "unknown/route",
        failure_class: "network_error",
      },
    });

    const counts = getCustomerRouteFailureCounts();
    expect(Object.keys(counts)).toHaveLength(0);
  });

  it("tracks multiple failures per route", () => {
    for (let i = 0; i < 3; i++) {
      logSecurityEvent("customer_route_failure", {
        meta: {
          route: "sandbox/protect",
          failure_class: "upstream_5xx",
          status: 500,
        },
      });
    }

    const counts = getCustomerRouteFailureCounts();
    expect(counts["sandbox/protect"]).toBe(3);
  });

  it("resets all counters with _resetSecurityEventCounters", () => {
    logSecurityEvent("customer_route_failure", {
      meta: {
        route: "sandbox/protect",
        failure_class: "network_error",
      },
    });

    _resetSecurityEventCounters();
    const counts = getCustomerRouteFailureCounts();
    expect(Object.keys(counts)).toHaveLength(0);
  });
});
