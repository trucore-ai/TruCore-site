import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
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
            "linear-gradient(160deg, rgba(11,18,32,1) 0%, rgba(5,10,20,1) 70%)",
          color: "#eef8ff",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "0.01em",
            color: "#b8e3ff",
          }}
        >
          TruCore
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "22px", maxWidth: 900 }}>
          <div style={{ fontSize: 64, lineHeight: 1.1, fontWeight: 700 }}>
            Trust infrastructure for autonomous finance.
          </div>
          <div style={{ fontSize: 30, lineHeight: 1.35, color: "#d8efff" }}>
            Policy-bound execution • Verifiable receipts • Fail-closed design
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
          <span>AI-native financial infrastructure</span>
          <span>trucore.xyz</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
