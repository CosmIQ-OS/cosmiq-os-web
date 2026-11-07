// Shared helpers for the ASCII canvases (splash, hero art, field and signal bands).
// Ported from the Tandem website's renderer: a low-res source (one pixel per
// cell) or a brightness function is turned into characters from a density ramp.

export const RAMP = " .:-=+*#%@";
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const charFor = (b: number) => RAMP[clamp(Math.floor(b * RAMP.length), 0, RAMP.length - 1)];

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Page colours, read from the CSS tokens so the canvases follow the theme. */
export const theme = { bg: "#000000", fg: "#F8FAFD", dim: "#8E918F", mono: "monospace", display: "sans-serif" };

export function refreshTheme() {
  if (typeof window === "undefined") return;
  const cs = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  theme.bg = read("--black", "#000000");
  theme.fg = read("--white", "#F8FAFD");
  theme.dim = read("--gray-1", "#8E918F");
  theme.mono = read("--font-mono", "monospace");
  theme.display = read("--font-display", "sans-serif");
}

/** Small screens redraw at ~30 fps; the motion is time-based, so it only gets coarser. */
export function frameGate() {
  let lastDraw = -1e9;
  return (now: number) => {
    if (window.innerWidth > 700) return true;
    if (now - lastDraw < 30) return false;
    lastDraw = now;
    return true;
  };
}

/** CSS-style cubic-bezier easing, solved with Newton steps. */
export function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 6; i++) {
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (sx(t) - x) / d;
    }
    return sy(clamp(t, 0, 1));
  };
}

/** Size a display line so that at its widest (wdth 125) it fills its parent's content box. */
export function fitWidest(el: HTMLElement) {
  const probe = el.cloneNode(true) as HTMLElement;
  Object.assign(probe.style, {
    position: "absolute", visibility: "hidden", padding: "0", fontSize: "100px",
    fontVariationSettings: '"wdth" 125, "wght" 900', whiteSpace: "nowrap", width: "auto",
  });
  document.body.appendChild(probe);
  const w = probe.getBoundingClientRect().width;
  probe.remove();
  if (!w || !el.parentElement) return;
  const ps = getComputedStyle(el.parentElement), es = getComputedStyle(el);
  const avail = el.parentElement.clientWidth
    - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight)
    - parseFloat(es.paddingLeft) - parseFloat(es.paddingRight);
  el.style.fontSize = (100 * avail / w) * 0.99 + "px";
}

export interface Ascii {
  g: CanvasRenderingContext2D;
  sg: CanvasRenderingContext2D;
  cols: number; rows: number; W: number; H: number; cellW: number; cellH: number;
  resize: () => void;
  begin: (fillBg?: boolean) => void;
  cell: (c: number, r: number, b: number) => void;
  drawSource: () => void;
}

export function createAscii(canvas: HTMLCanvasElement, cellW: number, cellH: number): Ascii {
  const g = canvas.getContext("2d")!;
  const src = document.createElement("canvas");
  const sg = src.getContext("2d", { willReadFrequently: true })!;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const a: Ascii = {
    g, sg, cols: 1, rows: 1, W: 0, H: 0, cellW, cellH,
    resize() {
      const r = canvas.getBoundingClientRect();
      a.W = r.width; a.H = r.height;
      canvas.width = Math.max(1, Math.round(a.W * dpr));
      canvas.height = Math.max(1, Math.round(a.H * dpr));
      a.cols = Math.max(1, Math.floor(a.W / cellW));
      a.rows = Math.max(1, Math.floor(a.H / cellH));
      src.width = a.cols; src.height = a.rows;
    },
    begin(fillBg = false) {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, a.W, a.H);
      if (fillBg) { g.fillStyle = theme.bg; g.fillRect(0, 0, a.W, a.H); }
      g.font = `600 ${Math.round(cellH * 0.82)}px ${theme.mono}`;
      g.textBaseline = "top";
      g.textAlign = "start";
      g.fillStyle = theme.fg;
    },
    cell(c, r, b) {
      const ch = charFor(b);
      if (ch !== " ") g.fillText(ch, c * cellW, r * cellH + cellH * 0.06);
    },
    drawSource() {
      const px = sg.getImageData(0, 0, a.cols, a.rows).data;
      for (let r = 0; r < a.rows; r++) for (let c = 0; c < a.cols; c++) a.cell(c, r, px[(r * a.cols + c) * 4] / 255);
    },
  };
  a.resize();
  return a;
}

