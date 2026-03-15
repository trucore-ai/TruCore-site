import { ImageResponse } from "next/og";
import { fetchPublicMetrics } from "@/lib/public-metrics";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

export default async function OpenGraphImage() {
  const result = await fetchPublicMetrics();

  const metrics = result.ok
    ? {
        protected: formatNumber(result.data.protected_requests_total),
        receipts: formatNumber(result.data.receipts_verified_total),
        uptime: `${result.data.uptime_percent.toFixed(2)}%`,
        latency: `${result.data.avg_request_latency_ms.toFixed(0)}ms`,
      }
    : {
        protected: "—",
        receipts: "—",
        uptime: "—",
        latency: "—",
      };

  const cards: { label: string; value: string }[] = [
    { label: "Protected Transactions", value: metrics.protected },
    { label: "Receipts Verified", value: metrics.receipts },
    { label: "Uptime", value: metrics.uptime },
    { label: "Avg Latency", value: metrics.latency },
  ];

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
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
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
          <div style={{ fontSize: 20, color: "#8ed3ff" }}>
            Agent Transaction Firewall
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ fontSize: 42, lineHeight: 1.15, fontWeight: 700 }}>
            Live Infrastructure Metrics
          </div>
        </div>

        {/* Metric Cards */}
        <div
          style={{
            display: "flex",
            gap: "24px",
          }}
        >
          {cards.map((card) => (
            <div
              key={card.label}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                padding: "28px 24px",
                borderRadius: "16px",
                background: "rgba(22,34,54,0.7)",
                border: "1px solid rgba(94,188,251,0.15)",
              }}
            >
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 700,
                  color: "#f08a1f",
                  lineHeight: 1.2,
                }}
              >
                {card.value}
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: "#b8e3ff",
                  marginTop: "8px",
                  fontWeight: 500,
                }}
              >
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 20,
            fontWeight: 500,
          }}
        >
          <span style={{ color: "#8ed3ff" }}>
            AI-native financial infrastructure
          </span>
          <span style={{ color: "#f08a1f" }}>trucore.xyz</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
