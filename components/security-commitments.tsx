import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";

const commitments = [
  "Fail-closed design",
  "Scoped permits",
  "Immutable audit trail",
  "Versioned releases",
];

export function SecurityCommitments() {
  return (
    <Section divider className="fade-in-up">
      <div className="mb-8 max-w-2xl">
        <h2 className="text-4xl font-bold tracking-tight text-accent-300">
          Security Commitments
        </h2>
        <p className="mt-4 text-2xl leading-[1.4] text-slate-200">
          Public trust commitments for production deployment, communicated at a
          high level.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {commitments.map((commitment) => (
          <Card key={commitment}>
            <p className="text-xl font-semibold text-slate-100">{commitment}</p>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-lg text-slate-300">
        See{" "}
        <Link
          href="/security/overview"
          className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
        >
          Security Overview
        </Link>{" "}
        and{" "}
        <Link
          href="/security/disclosure"
          className="font-semibold text-primary-300 underline underline-offset-2 transition-colors hover:text-primary-200"
        >
          Responsible Disclosure
        </Link>
        .
      </p>
    </Section>
  );
}