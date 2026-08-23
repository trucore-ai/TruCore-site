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
          padding: "56px",
          background: "linear-gradient(135deg, #0a1122 0%, #050a14 60%, #0d1a30 100%)",
          color: "#eef8ff",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "0.06em" }}>TruCore</div>
          <div style={{ fontSize: 14, color: "#f08a1f", fontWeight: 600, padding: "2px 10px", border: "1px solid #f08a1f", borderRadius: "6px" }}>
            Product
          </div>
        </div>

        {/* Hero */}
        <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.08, color: "#ffe0b2" }}>
            Agent Transaction
          </div>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.08, color: "#ffe0b2" }}>
            Firewall
          </div>
        </div>

        <div style={{ fontSize: 28, color: "#a8d4f0", marginTop: "16px", maxWidth: 800 }}>
          Deterministic guardrails and tamper-evident receipts for autonomous agents.
        </div>

        {/* Key features */}
        <div style={{ display: "flex", gap: "16px", marginTop: "36px" }}>
          {["Policy Gates", "Tamper Receipts", "Perps Enforcement"].map((f) => (
            <div
              key={f}
              style={{
                padding: "12px 20px",
                background: "rgba(20, 40, 70, 0.5)",
                border: "1px solid rgba(100, 160, 220, 0.15)",
                borderRadius: "8px",
                fontSize: 16,
                color: "#88b8d8",
              }}
            >
              {f}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 22, color: "#f08a1f", fontWeight: 500 }}>ATF</div>
          <div style={{ fontSize: 22, color: "#4a7a9b" }}>trucore.xyz/atf</div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
