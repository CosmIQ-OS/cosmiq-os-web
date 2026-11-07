"use client";
import { useEffect, useRef } from "react";
import { bezier, clamp, createAscii, prefersReducedMotion, theme } from "@/lib/ascii";

export default function SignalBand({ seed = 1 }: { seed?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const RUN_MS = 1500;
    const runEase = bezier(0.45, 0, 0.2, 1);
    const hash = (x: number, y: number, s: number) => {
      const h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
      return h - Math.floor(h);
    };

    const reduced = prefersReducedMotion();
    const A = createAscii(canvas, 9, 16);
    let head = reduced ? 2 : -1;

    function draw() {
      A.begin(false);
      if (head < 0) return;
      const knotX = head <= 1 ? head * (A.cols + 16) - 8 : Infinity;
      const knots: [number, number, number][] = [];
      A.g.fillStyle = theme.dim;
      for (let r = 0; r < A.rows; r++) {
        for (let c = 0; c < A.cols; c++) {
          if (c > knotX) continue;
          const u = c / A.cols, v = (r + 0.5) / A.rows;
          const y = 0.5 + 0.2 * Math.sin(u * Math.PI * 1.6 + seed) * Math.sin(u * Math.PI);
          const near = Math.exp(-Math.pow(v - y, 2) / 0.03);
          const edge = Math.min(1, u * 10, (1 - u) * 10);
          if (hash(c, r, seed) > near * edge * 0.55) continue;
          A.cell(c, r, 0.12 + 0.3 * near * hash(r, c, seed + 5));
          if (head <= 1) {
            const k = Math.exp(-Math.pow(c - knotX, 2) / 10) * near;
            if (k > 0.25) knots.push([c, r, 0.5 + 0.5 * k]);
          }
        }
      }
      A.g.fillStyle = theme.fg;
      for (const [c, r, b] of knots) A.cell(c, r, b);
    }

    function run() {
      const t0 = performance.now();
      const step = (now: number) => {
        const p = clamp((now - t0) / RUN_MS, 0, 1);
        head = p < 1 ? runEase(p) : 2;
        draw();
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    if (reduced || !("IntersectionObserver" in window)) {
      head = 2;
      draw();
    } else {
      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          io.unobserve(entry.target);
          run();
        },
        { threshold: 0.9 }
      );
      io.observe(canvas);
    }

    const onResize = () => {
      A.resize();
      draw();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [seed]);

  return (
    <div className="signal" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}

