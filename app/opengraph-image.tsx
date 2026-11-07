import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// The preview card shown when the site link is shared on WhatsApp, LinkedIn, etc.
export const alt = "CosmIQ: WhatsApp enquiry to quotation for food & testing labs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#f4f1ea", SURFACE = "#ebe6da", BORDER = "#d8d2c4", WHITE = "#0a0a0a", MUTED = "#4a4740", RED = "#ff5a1f", GREEN = "#146c3a";

export default async function Image() {
  const font = await readFile(join(process.cwd(), "assets/fonts/SpaceGrotesk-Bold.ttf"));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: BG, color: WHITE, border: `2px solid ${BORDER}`, padding: "52px 64px", fontFamily: "Space Grotesk" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 42, letterSpacing: -1 }}>
            <div style={{ width: 46, height: 46, borderRadius: 10, background: SURFACE, border: `2px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", color: WHITE, fontSize: 26 }}>
              C
            </div>
            CosmIQ
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: SURFACE, border: `2px solid ${BORDER}`, borderRadius: 999, padding: "10px 22px", fontSize: 20, color: WHITE, letterSpacing: 1 }}>
            <div style={{ width: 10, height: 10, borderRadius: 999, background: RED }} />
            FOR FOOD &amp; TESTING LABS
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 88, lineHeight: 1.02, letterSpacing: -3 }}>
          <div style={{ display: "flex", color: WHITE }}>WHATSAPP ENQUIRY</div>
          <div style={{ display: "flex", color: WHITE }}>TO QUOTATION.</div>
          <div style={{ display: "flex", marginTop: 12 }}>
            <div style={{ display: "flex", background: RED, color: "#ffffff", padding: "2px 18px", borderRadius: 8 }}>NO GUESSWORK.</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `2px solid ${BORDER}`, paddingTop: 22, fontSize: 24, color: MUTED }}>
          <div style={{ display: "flex" }}>AI agents on top of your LIMS · prices from your data · staff approve</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: GREEN, fontSize: 20 }}>
            <div style={{ width: 10, height: 10, borderRadius: 999, background: GREEN }} />
            LIMS VERIFIED
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Space Grotesk", data: font, style: "normal", weight: 700 }] },
  );
}
