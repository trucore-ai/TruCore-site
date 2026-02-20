import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function BlogOpenGraphImage() {
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
          background: "linear-gradient(160deg, rgba(10,24,42,1) 0%, rgba(5,12,22,1) 70%)",
          color: "#eef8ff",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: 26,
            fontWeight: 600,
            color: "#b8e3ff",
          }}
        >
          TruCore Blog
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: 930 }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, color: "#ffe0b2" }}>
            TruCore Blog
          </div>
          <div style={{ fontSize: 34, lineHeight: 1.28, color: "#d8efff" }}>
            Infrastructure for Autonomous Finance
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
          <span>Policy-first technical notes</span>
          <span>trucore.xyz/blog</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}