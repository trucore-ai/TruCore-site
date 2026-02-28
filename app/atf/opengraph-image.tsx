import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function AtfOpenGraphImage() {
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
          background:
            "linear-gradient(160deg, rgba(10,18,32,1) 0%, rgba(5,10,20,1) 70%)",
          color: "#eef8ff",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 28,
            fontWeight: 600,
            color: "#b8e3ff",
          }}
        >
          TruCore
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: 920 }}>
          <div style={{ fontSize: 66, lineHeight: 1.08, fontWeight: 700, color: "#ffe0b2" }}>
            Agent Transaction Firewall
          </div>
          <div style={{ fontSize: 30, lineHeight: 1.32, color: "#d8efff" }}>
            Deterministic guardrails and tamper-evident receipts for autonomous execution.
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
          <span>ATF</span>
          <span>trucore.xyz/atf</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
