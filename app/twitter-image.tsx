import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function TwitterImage() {
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
            "linear-gradient(180deg, rgba(11,18,32,1) 0%, rgba(5,10,20,1) 100%)",
          color: "#eef8ff",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "0.01em", color: "#b8e3ff" }}>
          TruCore
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: 920 }}>
          <div style={{ fontSize: 62, lineHeight: 1.1, fontWeight: 700 }}>
            Trust infrastructure for autonomous finance.
          </div>
          <div style={{ fontSize: 30, color: "#d8efff" }}>
            Zero-trust controls with verifiable AI execution.
          </div>
        </div>

        <div style={{ fontSize: 24, color: "#ffb347" }}>trucore.xyz</div>
      </div>
    ),
    {
      ...size,
    },
  );
}
