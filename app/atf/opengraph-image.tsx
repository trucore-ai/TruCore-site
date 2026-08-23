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
          background: "linear-gradient(135deg, #050a14 0%, #0a1628 40%, #1a0d05 70%, #0a1628 100%)",
          fontFamily: "Inter, system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Glow orbs */}
        <div style={{ position: "absolute", top: -60, right: -80, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(240,138,31,0.18) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -100, left: -40, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(240,138,31,0.10) 0%, transparent 70%)" }} />
        {/* Subtle grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(240,138,31,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(240,138,31,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        {/* Content layer */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", padding: "56px", width: "100%", height: "100%" }}>

          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #f08a1f 0%, #f5a623 100%)" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0a1628" }}>T</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#eef8ff", letterSpacing: "0.04em" }}>TruCore</div>
              <div style={{ fontSize: 13, color: "#4a7a9b", fontWeight: 400, marginTop: 2 }}>ATF — Product Detail</div>
            </div>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(240,138,31,0.15) 0%, transparent 100%)", marginLeft: 24 }} />
          </div>

          {/* Main headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 900, marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <div style={{ width: 32, height: 3, borderRadius: 2, background: "linear-gradient(90deg, #f08a1f, #f5a623)" }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: "#f08a1f", textTransform: "uppercase", letterSpacing: "0.15em" }}>Agent Transaction Firewall</div>
            </div>
            <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, color: "#ffffff", letterSpacing: "-0.02em" }}>
              Deterministic Guardrails
            </div>
            <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, background: "linear-gradient(135deg, #f08a1f 0%, #f5a623 50%, #fbbf24 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em" }}>
              Tamper-Evident Receipts
            </div>
          </div>

          {/* Tagline */}
          <div style={{ display: "flex", marginBottom: 40, maxWidth: 750 }}>
            <div style={{ fontSize: 22, color: "#88b8d8", lineHeight: 1.5 }}>
              Policy enforcement for autonomous agents — verify every action, trust nothing.
            </div>
          </div>

          {/* Feature chips */}
          <div style={{ display: "flex", gap: 14, marginBottom: 36 }}>
            {["Policy Gates", "Tamper Receipts", "Perps Enforcement", "DEX Guardrails"].map((f) => (
              <div
                key={f}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 18px",
                  background: "rgba(240, 138, 31, 0.08)",
                  border: "1px solid rgba(240, 138, 31, 0.2)",
                  borderRadius: 10,
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f08a1f" }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: "#eef8ff" }}>{f}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" }}>
            <div style={{ fontSize: 18, color: "#6b8fa8", fontWeight: 500 }}>trucore.xyz/atf</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#f08a1f" }}>ATF v0.1</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
