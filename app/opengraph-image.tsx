import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// The preview card shown when the site link is shared on WhatsApp, LinkedIn, etc.
export const alt = "CosmIQ: WhatsApp enquiry to quotation for food & testing labs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0a0a0a", PAPER = "#f4f1ea", ORANGE = "#ff5a1f", YELLOW = "#ffd400";

export default async function Image() {
  const font = await readFile(join(process.cwd(), "assets/fonts/SpaceGrotesk-Bold.ttf"));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: PAPER, color: INK, border: `16px solid ${INK}`, padding: "48px 56px", fontFamily: "Space Grotesk" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 46 }}>
            <div style={{ width: 46, height: 46, background: ORANGE, border: `5px solid ${INK}`, boxShadow: `6px 6px 0 ${INK}` }} />
            CosmIQ
          </div>
          <div style={{ display: "flex", background: ORANGE, border: `4px solid ${INK}`, padding: "10px 18px", fontSize: 24, letterSpacing: 1 }}>
            FOR FOOD &amp; TESTING LABS
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 96, lineHeight: 1, letterSpacing: -3 }}>
          <div style={{ display: "flex" }}>WHATSAPP ENQUIRY</div>
          <div style={{ display: "flex" }}>TO QUOTATION.</div>
          <div style={{ display: "flex", marginTop: 8 }}>
            <div style={{ display: "flex", background: YELLOW, padding: "0 14px" }}>NO GUESSWORK.</div>
          </div>
        </div>
        <div style={{ display: "flex", borderTop: `4px solid ${INK}`, paddingTop: 20, fontSize: 28 }}>
          AI agents on top of your LIMS · prices from your data · staff approve
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Space Grotesk", data: font, style: "normal", weight: 700 }] },
  );
}
