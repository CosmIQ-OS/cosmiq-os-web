"use client";
import { useEffect, useRef } from "react";
import { bezier, clamp, createAscii, refreshTheme, theme } from "@/lib/ascii";

/**
 * The connect splash, in ASCII (after Tandem's): the wordmark sits in a field of
 * characters, drops spread from the tap point and bend it like water, then a
 * hole with a bright rim opens onto the page. It only runs when the inline head
 * script marked <html> with `splash` (home page, once per session, motion allowed).
 */
export default function Splash({ word = "CosmIQ" }: { word?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const canvas = ref.current;
    if (!canvas || !root.classList.contains("splash")) return;
    refreshTheme();
    const easeReveal = bezier(0.3, 0, 0.1, 1);
    const small = window.innerWidth < 600;
    const A = createAscii(canvas, small ? 5 : 10, small ? 9 : 17);
    let wordPx: Uint8ClampedArray = new Uint8ClampedArray(0);
    let phase: "waiting" | "rippling" | "done" = "waiting";
    let ripple0 = 0, reveal0 = 0, ox = 0, oy = 0, status = "tap anywhere to connect";

    const wave = (distPx: number, t: number) => {
      const front = t * 520;
      if (distPx > front) return 0;
      const x = front - distPx;
      return Math.sin(x * 0.11) * Math.exp(-x * 0.012) * Math.exp(-t * 0.9);
    };

    function paintWord() {
      A.resize();
      const s = A.sg;
      s.setTransform(1, 0, 0, 1, 0, 0);
      s.fillStyle = "#000"; s.fillRect(0, 0, A.cols, A.rows);
      s.setTransform(1 / A.cellW, 0, 0, 1 / A.cellH, 0, 0);
      const font = (px: number) => `900 ${px}px ${theme.display}`;
      let size = Math.min(A.W * 0.26, A.H * 0.32);
      s.font = font(size);
      size *= Math.min(1, (A.W * (A.W < 600 ? 0.88 : 0.78)) / s.measureText(word).width);
      s.font = font(size);
      s.textAlign = "center"; s.textBaseline = "middle"; s.fillStyle = "#fff";
      s.fillText(word, A.W / 2, A.H / 2 - size * 0.1);
      wordPx = s.getImageData(0, 0, A.cols, A.rows).data;
    }

    function finish() {
      phase = "done";
      try { sessionStorage.setItem("cosmiq-splash", "1"); } catch {}
      root.classList.remove("splash");
      window.dispatchEvent(new Event("cosmiq:intro"));
    }

    function frame(now: number) {
      if (phase === "done") return;
      const t = phase === "waiting" ? 0 : (now - ripple0) / 1000;
      let radius = 0;
      if (phase === "rippling" && now >= reveal0) {
        const far = Math.max(...[[0, 0], [A.W, 0], [0, A.H], [A.W, A.H]].map(([x, y]) => Math.hypot(x - ox, y - oy))) + 80;
        const k = (now - reveal0) / 600;
        if (k >= 1) return finish();
        radius = Math.max(1, easeReveal(k) * far);
      }
      A.begin();
      const g = A.g;
      g.fillStyle = theme.bg;
      if (radius > 0) {
        g.beginPath(); g.rect(0, 0, A.W, A.H); g.arc(ox, oy, radius, 0, Math.PI * 2); g.fill("evenodd");
      } else g.fillRect(0, 0, A.W, A.H);
      g.fillStyle = theme.fg;
      for (let r = 0; r < A.rows; r++) {
        for (let c = 0; c < A.cols; c++) {
          const px = (c + 0.5) * A.cellW, py = (r + 0.5) * A.cellH;
          const dx = px - ox, dy = py - oy, dist = Math.hypot(dx, dy);
          if (radius > 0 && dist < radius) continue;
          let w = 0;
          if (t > 0) for (let i = 0; i < 3; i++) { const ti = t - i * 0.5333; if (ti > 0) w += wave(dist, ti % 1.6); }
          // refraction: sample the wordmark from a point pushed along the radius
          const disp = w * 7 * 2.2;
          const sc = clamp(Math.round((px - (dist ? dx / dist : 0) * disp) / A.cellW - 0.5), 0, A.cols - 1);
          const sr = clamp(Math.round((py - (dist ? dy / dist : 0) * disp) / A.cellH - 0.5), 0, A.rows - 1);
          let b = wordPx[(sr * A.cols + sc) * 4] / 255;
          b = Math.max(b, Math.max(w, 0) * 0.55);
          if (radius > 0) b = Math.max(b, Math.exp(-((dist - radius - 10) ** 2) / 120));
          A.cell(c, r, b);
        }
      }
      if (radius === 0) {
        g.font = `400 13px ${theme.mono}`;
        g.textAlign = "center";
        g.fillStyle = theme.dim;
        g.fillText(status, A.W / 2, A.H - 56);
      }
      requestAnimationFrame(frame);
    }

    function startRipple(x: number, y: number) {
      if (phase === "rippling") {
        return finish();
      }
      if (phase !== "waiting") return;
      clearTimeout(autoTimer);
      phase = "rippling";
      ox = x; oy = y;
      status = "connecting";
      ripple0 = performance.now();
      reveal0 = ripple0 + 600;
    }

    const onDown = (e: PointerEvent) => startRipple(e.clientX, e.clientY);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") startRipple(innerWidth / 2, innerHeight / 2);
    };
    const onResize = () => { if (phase !== "done") paintWord(); };
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);

    let autoTimer = 0;
    // Wait (briefly) for Archivo so the wordmark draws in it.
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 600))]).then(() => {
      refreshTheme();
      paintWord();
      requestAnimationFrame(frame);
      autoTimer = window.setTimeout(() => startRipple(innerWidth / 2, innerHeight / 2), 700);
    });

    return () => {
      clearTimeout(autoTimer);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [word]);

  return <canvas id="splash" ref={ref} aria-hidden="true" />;
}

