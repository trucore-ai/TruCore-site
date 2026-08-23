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
          background: "linear-gradient(135deg, #050a14 0%, #0a1628 40%, #0d1f3c 70%, #0a1628 100%)",
          fontFamily: "Inter, system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Glow orbs */}
        <div style={{ position: "absolute", top: -80, left: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(240,138,31,0.15) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -120, right: -60, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: 100, right: 200, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(240,138,31,0.08) 0%, transparent 70%)" }} />

        {/* Subtle grid overlay */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(100,160,220,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(100,160,220,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        {/* Content layer */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", padding: "56px", width: "100%", height: "100%" }}>

          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #f08a1f 0%, #f5a623 100%)" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0a1628" }}>T</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#eef8ff", letterSpacing: "0.04em" }}>TruCore</div>
              <div style={{ fontSize: 13, color: "#4a7a9b", fontWeight: 400, marginTop: 2 }}>AI Infrastructure</div>
            </div>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(100,160,220,0.2) 0%, transparent 100%)", marginLeft: 24 }} />
          </div>

          {/* Main headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 900, marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <div style={{ width: 32, height: 3, borderRadius: 2, background: "linear-gradient(90deg, #f08a1f, #f5a623)" }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: "#f08a1f", textTransform: "uppercase", letterSpacing: "0.15em" }}>Trustless Infrastructure</div>
            </div>
            <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.08, color: "#ffffff", letterSpacing: "-0.02em" }}>
              for Autonomous
            </div>
            <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.08, background: "linear-gradient(135deg, #f08a1f 0%, #f5a623 50%, #fbbf24 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em" }}>
              Finance
            </div>
          </div>

          {/* Tagline */}
          <div style={{ display: "flex", marginBottom: 40, maxWidth: 750 }}>
            <div style={{ fontSize: 22, color: "#88b8d8", lineHeight: 1.5 }}>
              Policy enforcement, agent payments & service discovery — all verifiable, all trustless.
            </div>
          </div>

          {/* Product fleet cards */}
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { name: "ATF", desc: "Agent Transaction Firewall", color: "#f08a1f", icon: "◆" },
              { name: "x402Fuel", desc: "HTTP 402 Wallet Daemon", color: "#38bdf8", icon: "◇" },
              { name: "MeshDNS", desc: "MCP Service Registry", color: "#a78bfa", icon: "○" },
            ].map((p) => (
              <div
                key={p.name}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  padding: "20px 22px",
                  background: "rgba(15, 25, 45, 0.6)",
                  border: `1px solid ${p.color}22`,
                  borderRadius: 14,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${p.color}, transparent)` }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <div style={{ fontSize: 14, color: p.color, fontWeight: 700 }}>{p.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#eef8ff" }}>{p.name}</div>
                </div>
                <div style={{ fontSize: 14, color: "#6b8fa8" }}>{p.desc}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
              <div style={{ fontSize: 14, color: "#4a7a9b" }}>All systems operational</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#f08a1f" }}>trucore.xyz</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
