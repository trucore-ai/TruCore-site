import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SimulatorForm } from "@/components/simulator-form";

export const metadata: Metadata = {
  title: "ATF Policy Simulator",
  description:
    "Preview deterministic ATF policy enforcement powered by firewall-api, no wallet or chain connection required.",
};

export default function AtfSimulatorPage() {
  return (
    <Container>
      <Section className="fade-in-up">
        <div className="max-w-4xl space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-[#ffe0b2] sm:text-6xl">
            ATF Policy Simulator
          </h1>
          <p className="text-xl leading-[1.5] text-slate-200 sm:text-2xl">
            Try deterministic policy enforcement with preloaded scenarios, no wallet required.
          </p>
          <p className="text-sm text-slate-400">
            This demo is read-only and powered by firewall-api, it demonstrates live decision behavior
            without exposing secrets.
          </p>
        </div>
      </Section>

      <Section className="border-t border-white/10 fade-in-up fade-delay-1">
        <Suspense
          fallback={<p className="text-sm text-slate-300">Loading simulator...</p>}
        >
          <SimulatorForm />
        </Suspense>
      </Section>
    </Container>
  );
}