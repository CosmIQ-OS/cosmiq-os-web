"use client";
import { useEffect, useRef, useState } from "react";

interface RippleDrop {
  x: number;
  y: number;
  t: number;
  amp: number;
}

// Tandem's exact ASCII density gradient ramp from docs/ANDROID.md
const RAMP = " .:-=+*#%@";

export function TandemAsciiWordmark({
  word = "COSMIQ",
  variant = "hero",
}: {
  word?: string;
  variant?: "hero" | "footer";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
    if (!offCtx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let cellW = variant === "hero" ? 8 : 9;
    let cellH = variant === "hero" ? 13 : 14;
    let glyphBrightness: Float32Array = new Float32Array(0);
    let rafId: number | null = null;
    const drops: RippleDrop[] = [];
    const bootTime = performance.now();

    function rasterizeWordmark() {
      if (!offCtx || cols <= 0 || rows <= 0) return;
      offscreen.width = cols;
      offscreen.height = rows;
      offCtx.clearRect(0, 0, cols, rows);

      // Draw crisp vector letterforms using Archivo Black onto the grid bitmap
      offCtx.fillStyle = "#ffffff";
      offCtx.textAlign = "center";
      offCtx.textBaseline = "middle";

      // Fit the word across ~92% of the grid width
      let fontSize = rows * 0.88;
      offCtx.font = `900 ${fontSize}px var(--font-head), "Archivo Black", Impact, sans-serif`;
      const measured = offCtx.measureText(word).width;
      if (measured > 0) {
        fontSize = Math.min(rows * 0.92, (cols * 0.94 / measured) * fontSize);
      }
      offCtx.font = `900 ${fontSize}px var(--font-head), "Archivo Black", Impact, sans-serif`;
      offCtx.fillText(word, cols * 0.5, rows * 0.53);

      const img = offCtx.getImageData(0, 0, cols, rows).data;
      glyphBrightness = new Float32Array(cols * rows);

      // Compute soft edge distance / anti-aliased brightness for rich ASCII ramp shading
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = (r * cols + c) * 4;
          const a = img[i + 3] / 255;
          // 3x3 neighborhood blur for multi-level ASCII ramp transitions on glyph edges
          let sum = a * 2;
          let weight = 2;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                sum += img[(nr * cols + nc) * 4 + 3] / 255;
                weight += 1;
              }
            }
          }
          glyphBrightness[r * cols + c] = Math.min(1, (sum / weight) * 1.15);
        }
      }
    }

    function resize() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const isMobile = width < 640;
      cellW = isMobile ? 6.5 : variant === "hero" ? 8 : 8.5;
      cellH = isMobile ? 11 : variant === "hero" ? 13 : 14;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.max(10, Math.floor(width / cellW));
      rows = Math.max(6, Math.floor(height / cellH));
      rasterizeWordmark();
      renderFrame(performance.now());
    }

    function spawnDrop(x: number, y: number, amp = 1.0) {
      if (reducedMotion.matches) return;
      drops.push({ x, y, t: performance.now(), amp });
      if (drops.length > 10) drops.shift();
      ensureLoop();
    }

    function sampleGlyph(col: number, row: number): number {
      const c = Math.round(col);
      const r = Math.round(row);
      if (c < 0 || c >= cols || r < 0 || r >= rows) return 0;
      return glyphBrightness[r * cols + c] || 0;
    }

    function renderFrame(now: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const fontPx = Math.max(9, Math.floor(cellH * 0.86));
      ctx.font = `700 ${fontPx}px var(--font-mono), "JetBrains Mono", ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = drops.length - 1; i >= 0; i--) {
        if (now - drops[i].t > 2300) drops.splice(i, 1);
      }

      // Tandem hole-reveal + center ripple on initial hero load
      const sinceBoot = (now - bootTime) * 0.001;
      const revealDone = reducedMotion.matches || variant === "footer" || sinceBoot > 1.45;
      const revealRadius = !revealDone
        ? Math.pow(Math.max(0, sinceBoot - 0.15) / 1.3, 1.45) * Math.hypot(width, height) * 0.75
        : Infinity;

      for (let r = 0; r < rows; r++) {
        const py = (r + 0.5) * cellH;
        for (let c = 0; c < cols; c++) {
          const px = (c + 0.5) * cellW;

          // Calculate water-ripple displacement across all active drops
          let dispX = 0;
          let dispY = 0;
          let rimGlow = 0;

          for (let i = 0; i < drops.length; i++) {
            const d = drops[i];
            const age = (now - d.t) * 0.001;
            const dx = px - d.x;
            const dy = py - d.y;
            const dist = Math.hypot(dx, dy) + 0.0001;
            const waveRadius = age * 270;
            const delta = dist - waveRadius;
            if (Math.abs(delta) < 88) {
              const env = Math.exp(-(delta * delta) / 1450) * Math.max(0, 1 - age / 2.3) * d.amp;
              const wave = Math.sin(delta * 0.13);
              // Bend the ASCII letters like water
              dispX += (dx / dist) * wave * env * 2.3;
              dispY += (dy / dist) * wave * env * 1.9;
              rimGlow += Math.max(0, wave) * env * 0.65;
            }
          }

          // Sample displaced coordinate from the Archivo Black wordmark bitmap
          const baseVal = sampleGlyph(c - dispX, r - dispY);

          // Subtle background ASCII field around the wordmark
          const ambientWave =
            variant === "hero"
              ? (Math.sin(c * 0.25 + r * 0.35 - now * 0.0012) * 0.5 + 0.5) * 0.12
              : 0;

          let brightness = Math.min(1, baseVal + rimGlow * (baseVal > 0.05 ? 0.55 : 0.28) + ambientWave);

          // Bright-rimmed hole reveal animation on boot
          if (!revealDone) {
            const centerDist = Math.hypot(px - width * 0.5, py - height * 0.5);
            const rimDist = Math.abs(centerDist - revealRadius);
            if (rimDist < 42) {
              const rimFactor = Math.exp(-(rimDist * rimDist) / 480);
              brightness = Math.min(1, brightness + rimFactor * 0.75);
            }
          }

          if (brightness < 0.06) continue;

          const rampIdx = Math.min(
            RAMP.length - 1,
            Math.max(1, Math.floor(brightness * (RAMP.length - 1)))
          );
          const ch = RAMP[rampIdx];

          if (baseVal > 0.15) {
            // Inside the COSMIQ letterforms: crisp high-contrast white/silver ASCII characters
            const alpha = Math.min(1, 0.38 + brightness * 0.62);
            if (rimGlow > 0.22) {
              ctx.fillStyle = `rgba(255, 255, 255, ${ Math.min(1, alpha + 0.2).toFixed(2) })`;
            } else {
              ctx.fillStyle = `rgba(245, 245, 247, ${ alpha.toFixed(2) })`;
            }
          } else {
            // Ambient ripple halo around the wordmark
            const alpha = Math.min(0.42, brightness * 0.55);
            ctx.fillStyle =
              rimGlow > 0.2
                ? `rgba(255, 90, 79, ${ (alpha * 0.9).toFixed(2) })`
                : `rgba(138, 142, 150, ${ (alpha * 0.65).toFixed(2) })`;
          }

          ctx.fillText(ch, px, py);
        }
      }

      if (drops.length > 0 || !revealDone) {
        rafId = requestAnimationFrame(renderFrame);
      } else {
        rafId = null;
      }
    }

    function ensureLoop() {
      if (rafId === null && !document.hidden) {
        rafId = requestAnimationFrame(renderFrame);
      }
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // Re-rasterize once web fonts (Archivo Black) finish loading so kerning is baked
    document.fonts?.ready.then(() => {
      rasterizeWordmark();
      renderFrame(performance.now());
    });

    // Initial center water drop on load, matching Tandem's AsciiSplashView
    if (!reducedMotion.matches && variant === "hero") {
      spawnDrop(width * 0.5, height * 0.5, 1.35);
      setTimeout(() => spawnDrop(width * 0.35, height * 0.52, 0.9), 360);
      setTimeout(() => spawnDrop(width * 0.65, height * 0.48, 0.9), 620);
    }

    let lastPointerTime = 0;
    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastPointerTime < 55) return;
      lastPointerTime = now;
      const rect = canvas.getBoundingClientRect();
      spawnDrop(e.clientX - rect.left, e.clientY - rect.top, 0.85);
    };
    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      spawnDrop(e.clientX - rect.left, e.clientY - rect.top, 1.4);
    };

    canvas.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("pointerdown", onPointerDown, { passive: true });

    return () => {
      ro.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [word, variant]);

  return (
    <div
      className={`tandem-ascii-stage ${variant === "footer" ? "tandem-ascii-footer" : "tandem-ascii-hero"}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="tandem-wordmark-canvas" />
      <span className="tandem-ascii-hint">
        {variant === "hero" ? "ASCII · WATER RIPPLE · TAP OR HOVER" : "RIPPLE WORDMARK · BAKED KERNING"}
      </span>
    </div>
  );
}

// Tandem's rolling odometer counter in the hero
export function TandemOdometer({ target = 1482, label = "quotes verified" }: { target?: number; label?: string }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return;
    }
    const timer = setTimeout(() => setValue(target), 120);
    return () => clearTimeout(timer);
  }, [target]);

  const formatted = value.toLocaleString("en-US").padStart(target.toLocaleString("en-US").length, "0");

  return (
    <span className="tandem-odometer" aria-label={`${target.toLocaleString("en-US")} ${label}`}>
      <span className="tandem-odo-dot" aria-hidden="true" />
      <span className="tandem-odo-digits" aria-hidden="true">
        {formatted.split("").map((ch, idx) => {
          const isDigit = ch >= "0" && ch <= "9";
          if (!isDigit) {
            return (
              <span key={idx} className="tandem-odo-sep">
                {ch}
              </span>
            );
          }
          const num = Number(ch);
          return (
            <span key={idx} className="tandem-odo-col">
              <span
                className="tandem-odo-strip"
                style={{
                  transform: `translateY(-${num * 10}%)`,
                  transitionDelay: `${idx * 65}ms`,
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                  <span key={d} className="tandem-odo-cell">
                    {d}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
      <span className="tandem-odo-label">{label}</span>
    </span>
  );
}

const CHANNEL_TABS = [
  {
    id: "whatsapp",
    label: "WhatsApp Cloud API",
    latency: "~1.2 s LIMS lookup",
    cmd: "cosmiq connect --channel whatsapp --lims-verify strict",
    steps: [
      "Customer sends a free-text test enquiry on your lab's WhatsApp Business number.",
      "Name, phone number and GST number are checked against your LIMS customer database.",
      "Agent confirms exact service parameters, sample matrix & count — then queues quote for staff approval.",
    ],
  },
  {
    id: "webchat",
    label: "Web-Chat Pilot",
    latency: "Zero live-channel risk",
    cmd: "cosmiq pilot --mode web-chat --catalog ./lims-services.json",
    steps: [
      "Run the complete enquiry → verification → quotation loop in a sandboxed web chat first.",
      "Connected to your real LIMS service catalogue, turnaround times and tax rules.",
      "Once your front-desk team signs off, switch traffic to WhatsApp with zero workflow changes.",
    ],
  },
  {
    id: "lims",
    label: "Direct LIMS Sync",
    latency: "Deterministic pricing",
    cmd: "cosmiq sync --source lims-api --allow-ai-pricing=false",
    steps: [
      "Services, test methods, sample requirements and prices are read directly from your LIMS API.",
      "Backend business logic computes line totals and GST — the language model never touches numbers.",
      "Approved quotations are generated from your fixed PDF template and logged with a full audit trace.",
    ],
  },
];

export function TandemTerminalTabs() {
  const [active, setActive] = useState(CHANNEL_TABS[0].id);
  const [copied, setCopied] = useState(false);
  const current = CHANNEL_TABS.find((t) => t.id === active) ?? CHANNEL_TABS[0];

  function copyCmd() {
    navigator.clipboard?.writeText(current.cmd).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="tandem-term-card" aria-label="Deployment modes">
      <div className="tandem-term-tabs" role="tablist" aria-label="Integration modes">
        {CHANNEL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            className={`tandem-term-tab${active === tab.id ? " active" : ""}`}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        <span className="tandem-term-metric">{current.latency}</span>
      </div>

      <div className="tandem-term-cmd">
        <code>
          <span className="tandem-prompt">$</span> {current.cmd}
        </code>
        <button type="button" className="tandem-copy-btn" onClick={copyCmd}>
          {copied ? "COPIED ✓" : "COPY"}
        </button>
      </div>

      <ol className="tandem-term-steps">
        {current.steps.map((s, i) => (
          <li key={i}>
            <span className="tandem-step-idx">0{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
