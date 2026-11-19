import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// The preview card shown when the site link is shared on WhatsApp, LinkedIn, etc.
export const alt = "CosmIQ OS: Safe AI Automation & Custom Agents for Business";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#f4f1ea",
  SURFACE = "#ebe6da",
  BORDER = "#d8d2c4",
  WHITE = "#0a0a0a",
  MUTED = "#4a4740",
  RED = "#ff5a1f",
  GREEN = "#146c3a";

export default async function Image() {
  const font = await readFile(join(process.cwd(), "assets/fonts/SpaceGrotesk-Bold.ttf"));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BG,
          color: WHITE,
          border: `2px solid ${BORDER}`,
          padding: "52px 64px",
          fontFamily: "Space Grotesk",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 42, letterSpacing: -1 }}>
            <svg viewBox="0 0 200 200" width="54" height="54">
              <polygon
                points="34.53,58.00 100.00,20.20 142.56,44.77 127.89,53.24 100.00,37.13 63.86,58.00 100.00,78.87 127.89,62.76 142.56,71.23 100.00,95.80"
                fill="#0a0a0a"
              />
              <polygon
                points="103.93,58.00 117.02,50.44 152.38,50.44 165.48,58.00 152.38,65.56 117.02,65.56"
                fill="#ff5a1f"
              />
              <polygon
                points="96.36,102.10 30.89,64.30 30.89,139.90 96.36,177.70 96.36,154.26 81.70,145.80 81.70,152.30 45.55,131.43 45.55,89.70 81.70,110.57 81.70,117.07 96.36,125.54"
                fill="#22201d"
              />
              <polygon
                points="103.64,102.10 169.11,64.30 169.11,81.23 143.71,95.90 143.71,137.63 169.11,122.97 169.11,139.90 103.64,177.70 103.64,160.77 129.04,146.10 129.04,104.37 103.64,119.03"
                fill="#3a3630"
              />
            </svg>
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <span>CosmIQ</span>
              <span style={{ fontSize: 18, color: RED, marginLeft: 4, marginTop: -2, letterSpacing: 1 }}>OS</span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: SURFACE,
              border: `2px solid ${BORDER}`,
              borderRadius: 0,
              padding: "10px 22px",
              fontSize: 20,
              color: WHITE,
              letterSpacing: 1,
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: 999, background: RED }} />
            SAFE BUSINESS AI
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 82, lineHeight: 1.04, letterSpacing: -3 }}>
          <div style={{ display: "flex", color: WHITE }}>CUT THE NOISE.</div>
          <div style={{ display: "flex", color: MUTED }}>CRAFT THE CORE.</div>
          <div style={{ display: "flex", marginTop: 12 }}>
            <div style={{ display: "flex", background: RED, color: "#ffffff", padding: "2px 18px" }}>
              CLAIM THE GROWTH.
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `2px solid ${BORDER}`,
            paddingTop: 22,
            fontSize: 23,
            color: MUTED,
          }}
        >
          <div style={{ display: "flex" }}>Automate what runs safely · Keep human hands for what matters</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: GREEN, fontSize: 20 }}>
            <div style={{ width: 10, height: 10, borderRadius: 999, background: GREEN }} />
            HUMAN IN THE LOOP
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Space Grotesk", data: font, style: "normal", weight: 700 }] }
  );
}
