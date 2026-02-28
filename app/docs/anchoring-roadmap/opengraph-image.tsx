import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function AnchoringRoadmapOpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background: "linear-gradient(160deg, rgba(9,18,33,1) 0%, rgba(5,10,20,1) 72%)",
          color: "#eef8ff",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: 24,
            fontWeight: 600,
            color: "#b8e3ff",
          }}
        >
          TruCore Docs
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: 980 }}>
          <div style={{ fontSize: 58, lineHeight: 1.08, fontWeight: 700, color: "#ffe0b2" }}>
            Anchoring &amp; Execution Roadmap
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.3, color: "#d8efff" }}>
            Phased evolution of deterministic receipts, signature verification, and planned anchoring for ATF
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#f08a1f",
            fontSize: 24,
            fontWeight: 500,
          }}
        >
          <span>ATF Documentation</span>
          <span>trucore.xyz/docs/anchoring-roadmap</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}