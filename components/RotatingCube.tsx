"use client";

import { useEffect, useRef } from "react";

const CX = 100;
const CY = 100;
const R = 84;
const COS30 = Math.sqrt(3) / 2;
const SQRT2 = Math.sqrt(2);
const PAD = 0.05;
const W = 1.12;
const S0 = 1.94;
const S1 = 3.06;

type Pt2 = [number, number];

const GLYPH_C: Pt2[] = [
  [5, 0],
  [0, 0],
  [0, 5],
  [5, 5],
  [5, 3.45],
  [3.88, 3.45],
  [3.88, 3.88],
  [W, 3.88],
  [W, W],
  [3.88, W],
  [3.88, 1.55],
  [5, 1.55],
];

const GLYPH_I: Pt2[] = [
  [0, 0],
  [5, 0],
  [5, W],
  [S1, W],
  [S1, 5 - W],
  [5, 5 - W],
  [5, 5],
  [0, 5],
  [0, 5 - W],
  [S0, 5 - W],
  [S0, W],
  [0, W],
];

const GLYPH_Q_MAIN: Pt2[] = [
  [0, 0],
  [5, 0],
  [5, 3.25],
  [3.88, 3.25],
  [3.88, W],
  [W, W],
  [W, 3.88],
  [3.25, 3.88],
  [3.25, 5],
  [0, 5],
];

const GLYPH_Q_ACCENT: Pt2[] = [
  [2.65, 2.65],
  [3.65, 2.65],
  [5, 4.0],
  [5, 5],
  [4.0, 5],
  [2.65, 3.65],
];

function projectPoint(X: number, Y: number, Z: number, cosT: number, sinT: number): string {
  const dx = X - 0.5;
  const dy = Y - 0.5;
  const rx = (dx * cosT + dy * sinT) * SQRT2;
  const ry = (dx * sinT - dy * cosT) * SQRT2;
  const x2d = CX + R * COS30 * rx;
  const y2d = CY + R * (0.5 * ry - (Z - 0.5));
  return `${x2d.toFixed(2)},${y2d.toFixed(2)}`;
}

function mapPolygon(
  poly: Pt2[],
  mapper: (s: number, t: number) => [number, number, number],
  cosT: number,
  sinT: number
): string {
  const span = 1 - 2 * PAD;
  return poly
    .map(([gx, gy]) => {
      const s = PAD + (gx / 5) * span;
      const t = PAD + (gy / 5) * span;
      const [X, Y, Z] = mapper(s, t);
      return projectPoint(X, Y, Z, cosT, sinT);
    })
    .join(" ");
}

interface SideFaceSpec {
  glyph: Pt2[];
  nx: number;
  ny: number;
  map: (s: number, t: number) => [number, number, number];
}

const SIDE_FACES: SideFaceSpec[] = [
  // Front-Left at 45 deg: Y = 0, normal (0, -1), letter C
  {
    glyph: GLYPH_C,
    nx: 0,
    ny: -1,
    map: (s, t) => [s, 0, 1 - t],
  },
  // Front-Right at 45 deg: X = 1, normal (+1, 0), letter I
  {
    glyph: GLYPH_I,
    nx: 1,
    ny: 0,
    map: (s, t) => [1, s, 1 - t],
  },
  // Back-Right: Y = 1, normal (0, +1), letter C
  {
    glyph: GLYPH_C,
    nx: 0,
    ny: 1,
    map: (s, t) => [1 - s, 1, 1 - t],
  },
  // Back-Left: X = 0, normal (-1, 0), letter I
  {
    glyph: GLYPH_I,
    nx: -1,
    ny: 0,
    map: (s, t) => [0, 1 - s, 1 - t],
  },
];

export interface RotatingCubeProps {
  size?: number;
  className?: string;
  speed?: number;
  blueprint?: boolean;
}

export default function RotatingCube({
  size = 28,
  className = "wordmark-cube",
  speed = 0.52,
  blueprint = false,
}: RotatingCubeProps) {
  const qMainRef = useRef<SVGPolygonElement | null>(null);
  const qAccentRef = useRef<SVGPolygonElement | null>(null);
  const sideARef = useRef<SVGPolygonElement | null>(null);
  const sideBRef = useRef<SVGPolygonElement | null>(null);
  const wireTopRef = useRef<SVGPolygonElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    let rafId = 0;
    const startTime = performance.now();
    const initialTheta = Math.PI / 4;

    const tick = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const theta = initialTheta + elapsed * speed;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      if (qMainRef.current) {
        qMainRef.current.setAttribute(
          "points",
          mapPolygon(GLYPH_Q_MAIN, (s, t) => [t, s, 1], cosT, sinT)
        );
      }
      if (qAccentRef.current) {
        qAccentRef.current.setAttribute(
          "points",
          mapPolygon(GLYPH_Q_ACCENT, (s, t) => [t, s, 1], cosT, sinT)
        );
      }
      if (wireTopRef.current) {
        const c0 = projectPoint(0, 0, 1, cosT, sinT);
        const c1 = projectPoint(0, 1, 1, cosT, sinT);
        const c2 = projectPoint(1, 1, 1, cosT, sinT);
        const c3 = projectPoint(1, 0, 1, cosT, sinT);
        wireTopRef.current.setAttribute("points", `${c0} ${c1} ${c2} ${c3}`);
      }

      // Compute visible side faces (dot product with camera direction > 0)
      const visible: { points: string; opacity: string; depth: number }[] = [];
      for (const face of SIDE_FACES) {
        const camDot = face.nx * sinT - face.ny * cosT;
        if (camDot > 0.005) {
          // Screen-space horizontal normal component determines lit (left) vs shade (right)
          const screenX = face.nx * cosT + face.ny * sinT;
          // At 45 deg: left face screenX = -0.707 -> opacity 0.86; right face screenX = +0.707 -> opacity 0.68
          const normLit = (-screenX / SQRT2 + 0.5); // 1 on left, 0 on right
          const opacity = (0.68 + 0.18 * Math.max(0, Math.min(1, normLit))).toFixed(2);
          visible.push({
            points: mapPolygon(face.glyph, face.map, cosT, sinT),
            opacity,
            depth: camDot,
          });
        }
      }

      visible.sort((a, b) => a.depth - b.depth);

      const slots = [sideARef.current, sideBRef.current];
      for (let i = 0; i < slots.length; i++) {
        const el = slots[i];
        if (!el) continue;
        const v = visible[i];
        if (v) {
          el.setAttribute("points", v.points);
          el.setAttribute("fill-opacity", v.opacity);
          el.style.display = "";
        } else {
          el.style.display = "none";
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [speed]);

  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      width={size}
      height={size}
      aria-hidden="true"
    >
      {blueprint && (
        <>
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke="var(--border-default)"
            strokeWidth="0.9"
            strokeDasharray="3 3"
          />
          <polygon
            ref={wireTopRef}
            points="27.25,58.00 100.00,16.00 172.75,58.00 100.00,100.00"
            fill="none"
            stroke="var(--border-default)"
            strokeWidth="0.9"
          />
        </>
      )}
      {/* Side Face Slot A (initial: Left Face C at 45°) */}
      <polygon
        ref={sideARef}
        points="96.36,102.10 30.89,64.30 30.89,139.90 96.36,177.70 96.36,154.26 81.70,145.80 81.70,152.30 45.55,131.43 45.55,89.70 81.70,110.57 81.70,117.07 96.36,125.54"
        fill="currentColor"
        fillOpacity="0.86"
      />
      {/* Side Face Slot B (initial: Right Face I at 45°) */}
      <polygon
        ref={sideBRef}
        points="103.64,102.10 169.11,64.30 169.11,81.23 143.71,95.90 143.71,137.63 169.11,122.97 169.11,139.90 103.64,177.70 103.64,160.77 129.04,146.10 129.04,104.37 103.64,119.03"
        fill="currentColor"
        fillOpacity="0.68"
      />
      {/* Top Face Q Main Ring (initial at 45°) */}
      <polygon
        ref={qMainRef}
        points="34.53,58.00 100.00,20.20 142.56,44.77 127.89,53.24 100.00,37.13 63.86,58.00 100.00,78.87 127.89,62.76 142.56,71.23 100.00,95.80"
        fill="currentColor"
      />
      {/* Top Face Q Signal Orange Vector Node (initial at 45°) */}
      <polygon
        ref={qAccentRef}
        points="103.93,58.00 117.02,50.44 152.38,50.44 165.48,58.00 152.38,65.56 117.02,65.56"
        fill="var(--accent-primary)"
      />
    </svg>
  );
}
