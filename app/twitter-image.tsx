import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function TwitterImage() {
  const products = [
    { name: "ATF", label: "Agent Transaction Firewall", icon: "🛡️" },
    { name: "x402Fuel", label: "HTTP 402 Wallet Daemon", icon: "⛽" },
    { name: "MeshDNS", label: "MCP Service Registry", icon: "🌐" },
  ];

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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "0.06em" }}>TruCore</div>
          <div style={{ fontSize: 18, color: "#4a7a9b", fontWeight: 400 }}>
            AI Infrastructure
          </div>
        </div>

        {/* Hero headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 40 }}>
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.1 }}>
            Trustless Infrastructure
          </div>
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.1, color: "#f08a1f" }}>
            for Autonomous Finance
          </div>
        </div>

        {/* Subtitle */}
        <div style={{ display: "flex", marginTop: 20 }}>
          <div style={{ fontSize: 26, color: "#a8d4f0", maxWidth: 800 }}>
            Policy enforcement, agent payments, and service discovery — all verifiable, all trustless.
          </div>
        </div>

        {/* Product cards */}
        <div style={{ display: "flex", gap: 24, marginTop: 48 }}>
          {products.map((p) => (
            <div
              key={p.name}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: "20px 24px",
                background: "rgba(20, 40, 70, 0.5)",
                border: "1px solid rgba(100, 160, 220, 0.15)",
                borderRadius: 12,
              }}
            >
              <div style={{ display: "flex", fontSize: 20, fontWeight: 600, color: "#b8e3ff" }}>
                {p.icon} {p.name}
              </div>
              <div style={{ display: "flex", fontSize: 16, color: "#88b8d8" }}>{p.label}</div>
            </div>
          ))}
        </div>

        {/* Footer spacer + footer */}
        <div style={{ display: "flex", flex: 1 }} />
        <div style={{ display: "flex" }}>
          <span style={{ fontSize: 22, color: "#f08a1f", fontWeight: 500 }}>
            trucore.xyz
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
