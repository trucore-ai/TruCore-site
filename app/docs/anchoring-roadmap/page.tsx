import type { Metadata } from "next";
import { RoadmapPhase } from "@/components/roadmap-phase";

const title = "ATF Anchoring & Execution Roadmap";
const description =
  "Phased evolution of deterministic receipts, signature verification, and planned anchoring for Agent Transaction Firewall.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    images: ["/docs/anchoring-roadmap/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/docs/anchoring-roadmap/opengraph-image"],
  },
};

export default function AnchoringRoadmapPage() {
  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">ATF Documentation</p>
        <h1 className="text-4xl font-bold tracking-tight text-accent-200 sm:text-5xl">Anchoring &amp; Execution Roadmap</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Transparent phased evolution of receipt verification and anchoring layers.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-100">Current State (Live)</h2>
        <div className="grid gap-4">
          <RoadmapPhase title="Phase 1, Deterministic Receipts" status="live">
            <li>Deterministic policy engine</li>
            <li>Canonical receipt structure (v1)</li>
            <li>SHA-256 receipt_hash</li>
            <li>Public recompute verification</li>
          </RoadmapPhase>

          <RoadmapPhase title="Phase 2, Signed Receipts" status="live">
            <li>Ed25519 signature over receipt_hash</li>
            <li>Public key discovery endpoint</li>
            <li>Signature verification API</li>
            <li>Verification Kit UX</li>
          </RoadmapPhase>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-100">Preview State (Not Yet Enabled)</h2>
        <RoadmapPhase title="Phase 3, Anchor Preview" status="preview">
          <li>Anchor status model</li>
          <li>Structured anchor_status field</li>
          <li>No on-chain writes</li>
          <li>Roadmap intent only</li>
        </RoadmapPhase>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-100">Planned Extensions (No Guarantees)</h2>
        <div className="grid gap-4">
          <RoadmapPhase title="Phase 4, Devnet Anchoring" status="planned">
            <li>Anchor receipt_hash to Solana devnet</li>
            <li>Include anchor_tx signature</li>
            <li>Add anchor verification API</li>
          </RoadmapPhase>

          <RoadmapPhase title="Phase 5, Mainnet Anchoring" status="future">
            <li>Mainnet anchoring option</li>
            <li>Batch anchoring support</li>
            <li>Independent third-party verification surface</li>
          </RoadmapPhase>

          <RoadmapPhase title="Phase 6, External Verifier SDK" status="future">
            <li>Standalone verifier package</li>
            <li>Receipt verification without server dependency</li>
            <li>Independent auditor compatibility</li>
          </RoadmapPhase>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-100">Design Principles</h2>
        <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-slate-300">
          <li>Deterministic first</li>
          <li>Signature before chain</li>
          <li>Chain anchoring is additive, not foundational</li>
          <li>No custody, no asset control</li>
          <li>Verification must remain portable</li>
        </ul>
      </section>
    </article>
  );
}