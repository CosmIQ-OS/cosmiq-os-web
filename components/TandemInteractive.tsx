"use client";
import { useEffect, useRef } from "react";

interface Drop {
  x: number;
  y: number;
  t: number;
  strength: number;
}

const RAMP = " ·:;~=+*#%@";

export function TandemAsciiBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    const cellW = 14;
    const cellH = 20;
    let rafId: number | null = null;
    const drops: Drop[] = [];

    function resize() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / cellW);
      rows = Math.ceil(height / cellH);
      draw(performance.now());
    }

    function addDrop(x: number, y: number, strength = 1) {
      if (reducedMotion.matches) return;
      drops.push({ x, y, t: performance.now(), strength });
      if (drops.length > 8) drops.shift();
      startLoop();
    }

    function draw(now: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.font = '700 11px ui-monospace, SFMono-Regular, Consolas, monospace';
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      // Prune expired ripples
      for (let i = drops.length - 1; i >= 0; i--) {
        if (now - drops[i].t > 2400) drops.splice(i, 1);
      }

      const slowTime = reducedMotion.matches ? 0 : now * 0.0008;

      for (let r = 0; r < rows; r++) {
        const py = r * cellH + cellH * 0.5;
        for (let c = 0; c < cols; c++) {
          const px = c * cellW + cellW * 0.5;

          // Base ambient field
          const nx = (c / Math.max(1, cols)) - 0.5;
          const ny = (r / Math.max(1, rows)) - 0.5;
          const distCenter = Math.hypot(nx * 1.3, ny);
          let wave = Math.sin(c * 0.22 + r * 0.18 - slowTime) * 0.5 + 0.5;
          wave *= Math.max(0, 1 - distCenter * 1.15);

          let dx = 0;
          let dy = 0;
          let rippleBoost = 0;

          for (let i = 0; i < drops.length; i++) {
            const d = drops[i];
            const age = (now - d.t) * 0.001;
            const vx = px - d.x;
            const vy = py - d.y;
            const dist = Math.hypot(vx, vy) + 0.001;
            const radius = age * 260;
            const band = dist - radius;
            if (Math.abs(band) < 90) {
              const env = Math.exp(-(band * band) / 1800) * Math.max(0, 1 - age / 2.4) * d.strength;
              const phase = Math.sin(band * 0.12);
              dx += (vx / dist) * phase * env * 6;
              dy += (vy / dist) * phase * env * 6;
              rippleBoost += Math.abs(phase) * env * 0.85;
            }
          }

          const intensity = Math.min(1, wave * 0.42 + rippleBoost);
          if (intensity < 0.08) continue;

          const idx = Math.min(RAMP.length - 1, Math.floor(intensity * (RAMP.length - 1)));
          const ch = RAMP[idx];
          if (ch === " ") continue;

          const alpha = Math.min(0.45, intensity * 0.38);
          ctx.fillStyle = rippleBoost > 0.18
            ? `rgba(255, 255, 255, ${(alpha + 0.14).toFixed(3)})`
            : `rgba(180, 184, 194, ${alpha.toFixed(3)})`;
          ctx.fillText(ch, px + dx, py + dy);
        }
      }
    }

    function loop(now: number) {
      draw(now);
      if (!reducedMotion.matches && !document.hidden) {
        rafId = requestAnimationFrame(loop);
      } else {
        rafId = null;
      }
    }

    function startLoop() {
      if (rafId === null && !reducedMotion.matches && !document.hidden) {
        rafId = requestAnimationFrame(loop);
      }
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // Initial center ripple on load like Tandem's splash
    if (!reducedMotion.matches) {
      setTimeout(() => addDrop(width * 0.5, height * 0.45, 1.15), 180);
      startLoop();
    }

    const hero = canvas.parentElement;
    let lastMove = 0;
    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastMove < 90) return;
      lastMove = now;
      const rect = canvas.getBoundingClientRect();
      addDrop(e.clientX - rect.left, e.clientY - rect.top, 0.7);
    };
    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      addDrop(e.clientX - rect.left, e.clientY - rect.top, 1.25);
    };

    hero?.addEventListener("pointermove", onPointerMove, { passive: true });
    hero?.addEventListener("pointerdown", onPointerDown, { passive: true });

    return () => {
      ro.disconnect();
      hero?.removeEventListener("pointermove", onPointerMove);
      hero?.removeEventListener("pointerdown", onPointerDown);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return <canvas ref={canvasRef} className="tandem-ascii-canvas" aria-hidden="true" />;
}

export function TandemFooterWordmark({ word = "COSMIQ" }: { word?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const spans = Array.from(el.querySelectorAll<HTMLSpanElement>(".tandem-char"));
    let rafId: number | null = null;
    let rippleCenter = -1;
    let rippleStart = 0;

    function animate(now: number) {
      const elapsed = (now - rippleStart) * 0.001;
      let active = false;

      spans.forEach((span, idx) => {
        const dist = Math.abs(idx - rippleCenter);
        const waveFront = elapsed * 10;
        const delta = dist - waveFront;
        if (elapsed < 1.2 && Math.abs(delta) < 2.6) {
          active = true;
          const env = Math.exp(-(delta * delta) * 0.9) * (1 - elapsed / 1.2);
          const y = -Math.sin(delta * 2.2) * env * 10;
          const bright = 1 + env * 0.35;
          span.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
          span.style.filter = `brightness(${bright.toFixed(2)})`;
        } else {
          span.style.transform = "translate3d(0, 0, 0)";
          span.style.filter = "none";
        }
      });

      if (active && !reduced.matches) {
        rafId = requestAnimationFrame(animate);
      } else {
        spans.forEach((s) => {
          s.style.transform = "translate3d(0, 0, 0)";
          s.style.filter = "none";
        });
        rafId = null;
      }
    }

    function trigger(index: number) {
      if (reduced.matches) return;
      rippleCenter = index;
      rippleStart = performance.now();
      if (rafId === null) rafId = requestAnimationFrame(animate);
    }

    const handlers = spans.map((span, idx) => {
      const fn = () => trigger(idx);
      span.addEventListener("pointerenter", fn);
      span.addEventListener("pointerdown", fn);
      return { span, fn };
    });

    return () => {
      handlers.forEach(({ span, fn }) => {
        span.removeEventListener("pointerenter", fn);
        span.removeEventListener("pointerdown", fn);
      });
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={containerRef} className="tandem-wordmark" aria-hidden="true">
      {word.split("").map((ch, i) => (
        <span key={i} className="tandem-char">
          {ch}
        </span>
      ))}
    </div>
  );
}

