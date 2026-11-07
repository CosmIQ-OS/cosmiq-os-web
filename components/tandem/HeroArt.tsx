"use client";
import { useEffect, useRef } from "react";
import { createAscii, frameGate, prefersReducedMotion, theme } from "@/lib/ascii";

/**
 * Hero ASCII art: dual devices (laptop + phone) with shared world and animated
 * field lines between them. Ported from Tandem's HeroArt canvas.
 */
export default function HeroArt() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const small = window.innerWidth < 700;
    const A = createAscii(canvas, small ? 5 : 7, small ? 9 : 12);
    const SCREEN_A = { x: 70, y: 71, w: 620, h: 386 };
    const SCREEN_B = { x: 761, y: 80, w: 172, h: 362 };
    const HILLS = [
      [[0, 250], [180, 170], [340, 230], [520, 140], [700, 220], [880, 150], [1060, 210]],
      [[0, 310], [220, 240], [400, 300], [610, 220], [820, 290], [990, 230], [1200, 300]],
      [[0, 370], [260, 320], [470, 360], [700, 310], [930, 365], [1150, 320]],
    ];
    const HILL_TONE = ["#141414", "#222222", "#333333"];
    const TERM_HOME = { x: 300, y: 150, w: 290, h: 200 };
    const termOnPhone = { x: 620 + 8, y: 8, w: 172 - 16, h: 362 - 16 };
    const cur = { ...TERM_HOME };
    const target = { ...TERM_HOME };
    const taps: { x: number; y: number; t: number }[] = [];
    let unit = 1, ox = 0, oy = 0, last = 0, t0 = 0, visible = true, running = false;

    function layout() {
      A.resize();
      unit = Math.min(A.W / 1000, A.H / 620);
      ox = (A.W - 1000 * unit) / 2;
      oy = (A.H - 620 * unit) / 2;
    }

    function drawWorld(s: CanvasRenderingContext2D, screen: typeof SCREEN_A, worldX: number) {
      s.save();
      s.beginPath();
      s.rect(screen.x, screen.y, screen.w, screen.h);
      s.clip();
      s.translate(screen.x - worldX, screen.y);
      s.fillStyle = "#000";
      s.fillRect(worldX, 0, screen.w, screen.h);
      HILLS.forEach((pts, i) => {
        s.beginPath();
        s.moveTo(pts[0][0], pts[0][1]);
        pts.forEach(([x, y]) => s.lineTo(x, y));
        s.lineTo(1500, 420);
        s.lineTo(0, 420);
        s.closePath();
        s.fillStyle = HILL_TONE[i];
        s.fill();
      });
      s.fillStyle = "#DADADA";
      s.beginPath();
      s.arc(1020 - 260, 110, 30, 0, Math.PI * 2);
      s.fill();

      if (worldX === 0) {
        // Top bar
        s.fillStyle = "#5A5A5A";
        s.fillRect(0, 0, 620, 12);
        // Browser / LIMS portal
        s.fillStyle = "#000";
        s.fillRect(24, 40, 250, 220);
        s.strokeStyle = "#9A9A9A";
        s.lineWidth = 3;
        s.strokeRect(24, 40, 250, 220);
        s.fillStyle = "#6A6A6A";
        s.fillRect(24, 40, 250, 18);
        s.fillStyle = "#444";
        for (let i = 0; i < 6; i++) {
          s.fillRect(40, 78 + i * 26, 150 + ((i * 37) % 60), 7);
        }
      }

      // Traveling chat / quotation card
      s.fillStyle = "#000";
      s.fillRect(cur.x, cur.y, cur.w, cur.h);
      s.strokeStyle = "#FFFFFF";
      s.lineWidth = 4;
      s.strokeRect(cur.x, cur.y, cur.w, cur.h);
      s.fillStyle = "#FFFFFF";
      s.fillRect(cur.x, cur.y, cur.w, 18);
      s.fillStyle = "#7A7A7A";
      const lines = Math.max(0, Math.floor((cur.h - 30) / 18));
      for (let i = 0; i < lines; i++) {
        s.fillRect(
          cur.x + 10,
          cur.y + 28 + i * 18,
          Math.max(10, (cur.w - 30) * (0.45 + (((i * 7 + Math.floor(last / 400)) % 5) / 10))),
          5
        );
      }
      s.restore();
    }

    function draw(now: number) {
      const s = A.sg;
      s.setTransform(1, 0, 0, 1, 0, 0);
      s.fillStyle = "#000";
      s.fillRect(0, 0, A.cols, A.rows);
      s.setTransform(unit / A.cellW, 0, 0, unit / A.cellH, ox / A.cellW, oy / A.cellH);
      s.translate(0, 70);

      // Field lines: dashes flowing between systems
      const t = (now - t0) / 1000;
      const fieldLine = (i: number) => {
        const sx = 330 + i * 75, ex = 790 + i * 28, h = 18 + i * 13;
        s.beginPath();
        s.moveTo(sx, 62);
        s.bezierCurveTo(sx + 40, -h, ex - 50, -h, ex, 72);
        s.stroke();
      };
      s.lineWidth = 6;
      s.strokeStyle = "#3A3A3A";
      for (let i = 0; i < 5; i++) fieldLine(i);
      s.strokeStyle = "#FFFFFF";
      s.setLineDash([26, 90]);
      s.lineDashOffset = -t * 110;
      for (let i = 0; i < 5; i++) fieldLine(i);
      s.setLineDash([]);

      // Laptop
      s.fillStyle = "#000";
      s.fillRect(60, 60, 640, 412);
      s.strokeStyle = "#FFFFFF";
      s.lineWidth = 7;
      s.strokeRect(60, 60, 640, 412);
      drawWorld(s, SCREEN_A, 0);
      s.fillStyle = "#D0D0D0";
      s.beginPath();
      s.moveTo(20, 474);
      s.lineTo(740, 474);
      s.lineTo(718, 494);
      s.lineTo(42, 494);
      s.closePath();
      s.fill();
      s.fillStyle = "#555";
      s.fillRect(320, 474, 120, 6);

      // Phone
      s.fillStyle = "#000";
      s.beginPath();
      s.roundRect(750, 70, 194, 382, 26);
      s.fill();
      s.strokeStyle = "#FFFFFF";
      s.lineWidth = 7;
      s.stroke();
      drawWorld(s, SCREEN_B, 620);
      s.fillStyle = "#000";
      s.beginPath();
      s.arc(847, 92, 6, 0, Math.PI * 2);
      s.fill();

      // Touch ripples on the phone
      for (let i = taps.length - 1; i >= 0; i--) {
        const k = (now - taps[i].t) / 700;
        if (k >= 1) {
          taps.splice(i, 1);
          continue;
        }
        s.strokeStyle = `rgba(255,255,255,${1 - k})`;
        s.lineWidth = 6;
        s.beginPath();
        s.arc(taps[i].x, taps[i].y, 8 + k * 46, 0, Math.PI * 2);
        s.stroke();
      }

      A.begin();
      A.drawSource();

      const g = A.g;
      g.font = `400 ${Math.max(10, Math.round((13 * unit) / 0.8))}px ${theme.mono}`;
      g.fillStyle = theme.dim;
      g.fillText("LIMS-API  :5432", ox + 60 * unit, oy + 582 * unit);
      g.fillText("WHATSAPP-CLIENT", ox + 750 * unit, oy + 540 * unit);
      g.fillText("QUOTE #Q-0142", ox + 750 * unit, oy + 540 * unit + 16);
    }

    const SCRIPT: [number, () => void][] = [
      [0, () => Object.assign(target, TERM_HOME)],
      [1400, () => Object.assign(target, termOnPhone)],
      [2600, () => taps.push({ x: 820, y: 200, t: performance.now() })],
      [3300, () => taps.push({ x: 880, y: 330, t: performance.now() })],
      [4000, () => taps.push({ x: 800, y: 380, t: performance.now() })],
      [5200, () => Object.assign(target, TERM_HOME)],
    ];
    const LOOP_MS = 7000;
    let loop0 = 0, next = 0;
    const gate = frameGate();

    function frame(now: number) {
      if (!visible) {
        running = false;
        return;
      }
      const dt = last ? Math.min(now - last, 250) : 16;
      last = now;
      const tt = now - loop0;
      if (tt >= LOOP_MS) {
        loop0 = now;
        next = 0;
      }
      while (next < SCRIPT.length && tt >= SCRIPT[next][0]) {
        SCRIPT[next++][1]();
      }
      const k = 1 - Math.exp(-dt / 160);
      for (const key in cur) {
        (cur as any)[key] += ((target as any)[key] - (cur as any)[key]) * k;
      }
      if (gate(now)) draw(now);
      requestAnimationFrame(frame);
    }

    const resume = () => {
      if (!running && visible) {
        running = true;
        last = 0;
        requestAnimationFrame(frame);
      }
    };

    layout();
    t0 = loop0 = performance.now();
    if (prefersReducedMotion()) {
      Object.assign(cur, termOnPhone);
      draw(t0);
      return;
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      resume();
    });
    io.observe(canvas);
    resume();

    const onResize = () => {
      layout();
      if (prefersReducedMotion()) draw(performance.now());
    };
    window.addEventListener("resize", onResize);

    return () => {
      io.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" />;
}

