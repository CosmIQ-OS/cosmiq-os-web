"use client";
import { useEffect, useRef } from "react";
import { createAscii, frameGate, prefersReducedMotion } from "@/lib/ascii";

export default function FieldBand() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const A = createAscii(canvas, 9, 16);
    const LINES = [
      { a: 0.3, f: 0.9, s: 0.5, p: 0 },
      { a: 0.22, f: 1.4, s: -0.35, p: 2 },
      { a: 0.36, f: 0.6, s: 0.25, p: 4 },
      { a: 0.18, f: 2.1, s: 0.7, p: 1 },
    ];
    let mx = -1e4, my = -1e4, hit = -1e4, visible = false;
    const t0 = performance.now();
    const gate = frameGate();
    const reduced = prefersReducedMotion();

    function draw(now: number) {
      if (!gate(now)) {
        if (visible && !reduced) requestAnimationFrame(draw);
        return;
      }
      const t = reduced ? 0 : (now - t0) / 1000;
      A.begin(true);
      for (let r = 0; r < A.rows; r++) {
        for (let c = 0; c < A.cols; c++) {
          const u = c / A.cols, v = r / A.rows;
          const px = (c + 0.5) * A.cellW, py = (r + 0.5) * A.cellH;
          const d = Math.hypot(px - mx, py - my), rt = (now - hit) / 1000;
          let shift = 0;
          if (rt > 0 && rt < 2.5 && d < rt * 520) {
            const x = rt * 520 - d;
            shift = Math.sin(x * 0.05) * Math.exp(-x * 0.01) * Math.exp(-rt * 1.4) * 0.12;
          }
          let b = 0;
          for (const L of LINES) {
            const y = 0.5 + L.a * Math.sin(u * Math.PI * 2 * L.f + t * L.s * 2 + L.p) * Math.cos(u * Math.PI * 0.8 - t * 0.2);
            b = Math.max(b, Math.exp(-Math.pow((v + shift) - y, 2) / 0.0035));
          }
          A.cell(c, r, b);
        }
      }
      if (visible && !reduced) requestAnimationFrame(draw);
    }

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (Math.hypot(x - mx, y - my) > 90 || performance.now() - hit > 900) {
        mx = x;
        my = y;
        hit = performance.now();
      }
    };

    canvas.addEventListener("pointermove", onPointer);
    const io = new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was) requestAnimationFrame(draw);
    });
    io.observe(canvas);

    const onResize = () => {
      A.resize();
      draw(performance.now());
    };
    window.addEventListener("resize", onResize);
    draw(performance.now());

    return () => {
      io.disconnect();
      canvas.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="field" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
