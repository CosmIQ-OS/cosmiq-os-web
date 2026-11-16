"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { refreshTheme } from "@/lib/ascii";

type ThemeMode = "light" | "dark";
type ExportTab = "css" | "json" | "markdown";

type TokenKey =
  | "bgCanvas"
  | "bgSurface"
  | "bgElevated"
  | "textPrimary"
  | "textSecondary"
  | "textMuted"
  | "borderDefault"
  | "accentPrimary"
  | "accentInk"
  | "statusSuccess"
  | "statusWarning"
  | "statusDanger";

type PaletteTokens = Record<TokenKey, string>;

interface PalettePreset {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  inspiration: string;
  light: PaletteTokens;
  dark: PaletteTokens;
}

interface TokenMeta {
  key: TokenKey;
  cssVar: string;
  legacyAlias: string;
  category: "Surface" | "Text" | "Border" | "Accent" | "Status";
  role: string;
  contrastAgainst?: "bgCanvas" | "accentPrimary";
}

const PREVIEW_VARS_KEY = "cosmiq-preview-vars";
const PREVIEW_STATE_KEY = "cosmiq-styleguide-state";

const TOKEN_META: TokenMeta[] = [
  {
    key: "bgCanvas",
    cssVar: "--bg-canvas",
    legacyAlias: "--black, --paper",
    category: "Surface",
    role: "Primary viewport & page canvas background (60% dominant layer).",
  },
  {
    key: "bgSurface",
    cssVar: "--bg-surface",
    legacyAlias: "--gray-3, --paper2",
    category: "Surface",
    role: "Cards, workflow panels, terminal boxes, and alternating bands.",
  },
  {
    key: "bgElevated",
    cssVar: "--bg-elevated",
    legacyAlias: "input / bubble / quote bg",
    category: "Surface",
    role: "Form inputs, WhatsApp message bubbles, quotation rows, elevated controls.",
  },
  {
    key: "textPrimary",
    cssVar: "--text-primary",
    legacyAlias: "--white, --ink",
    category: "Text",
    role: "Headings, primary body copy, active borders, inverted section fills.",
    contrastAgainst: "bgCanvas",
  },
  {
    key: "textSecondary",
    cssVar: "--text-secondary",
    legacyAlias: "--gray-1",
    category: "Text",
    role: "Lede paragraphs, descriptions, workflow labels, table values.",
    contrastAgainst: "bgCanvas",
  },
  {
    key: "textMuted",
    cssVar: "--text-muted",
    legacyAlias: "--mut",
    category: "Text",
    role: "Metadata, timestamps, kickers, subtle captions.",
    contrastAgainst: "bgCanvas",
  },
  {
    key: "borderDefault",
    cssVar: "--border-default",
    legacyAlias: "--gray-2, --line",
    category: "Border",
    role: "1px structural hairlines, grid rules, card outlines, table dividers.",
    contrastAgainst: "bgCanvas",
  },
  {
    key: "accentPrimary",
    cssVar: "--accent-primary",
    legacyAlias: "--red, --acc",
    category: "Accent",
    role: "Primary CTAs, focus rings, highlight claims, active step markers (10%).",
    contrastAgainst: "bgCanvas",
  },
  {
    key: "accentInk",
    cssVar: "--accent-ink",
    legacyAlias: "--acc-ink",
    category: "Accent",
    role: "Text & icon foreground placed directly on top of --accent-primary.",
    contrastAgainst: "accentPrimary",
  },
  {
    key: "statusSuccess",
    cssVar: "--status-success",
    legacyAlias: "--live, --ok",
    category: "Status",
    role: "LIMS verified checks, active telemetry dots, confidence pills.",
    contrastAgainst: "bgCanvas",
  },
  {
    key: "statusWarning",
    cssVar: "--status-warning",
    legacyAlias: "--hi",
    category: "Status",
    role: "Attention flags, pending review markers, high-visibility callouts.",
    contrastAgainst: "bgCanvas",
  },
  {
    key: "statusDanger",
    cssVar: "--status-danger",
    legacyAlias: "--err",
    category: "Status",
    role: "Validation errors, rejected states, critical alert banners.",
    contrastAgainst: "bgCanvas",
  },
];

const PRESETS: PalettePreset[] = [
  {
    id: "tandem-default",
    code: "01",
    name: "Tandem Warm Paper",
    subtitle: "Current Baseline",
    inspiration: "Warm editorial parchment paired with stark ink and high-visibility orange.",
    light: {
      bgCanvas: "#f4f1ea",
      bgSurface: "#ebe6da",
      bgElevated: "#ffffff",
      textPrimary: "#0a0a0a",
      textSecondary: "#2d2b27",
      textMuted: "#4a4740",
      borderDefault: "#d8d2c4",
      accentPrimary: "#ff5a1f",
      accentInk: "#ffffff",
      statusSuccess: "#146c3a",
      statusWarning: "#ffd400",
      statusDanger: "#c81e1e",
    },
    dark: {
      bgCanvas: "#0a0a0a",
      bgSurface: "#181715",
      bgElevated: "#22201d",
      textPrimary: "#f4f1ea",
      textSecondary: "#9e9a90",
      textMuted: "#78746b",
      borderDefault: "#2e2b27",
      accentPrimary: "#ff5a1f",
      accentInk: "#ffffff",
      statusSuccess: "#4ade80",
      statusWarning: "#ffd400",
      statusDanger: "#f87171",
    },
  },
  {
    id: "radix-sand-orange",
    code: "02",
    name: "Radix Sand & Aerospace",
    subtitle: "Refined Editorial",
    inspiration: "Radix warm sand neutral scale with calibrated orange and dark ink accent text.",
    light: {
      bgCanvas: "#f9f8f6",
      bgSurface: "#f1f0ec",
      bgElevated: "#ffffff",
      textPrimary: "#111110",
      textSecondary: "#3b3a37",
      textMuted: "#63625e",
      borderDefault: "#dad9d3",
      accentPrimary: "#e54d2e",
      accentInk: "#ffffff",
      statusSuccess: "#18794e",
      statusWarning: "#f59e0b",
      statusDanger: "#dc2626",
    },
    dark: {
      bgCanvas: "#111110",
      bgSurface: "#191918",
      bgElevated: "#222221",
      textPrimary: "#eeeeec",
      textSecondary: "#b5b3ad",
      textMuted: "#7c7b74",
      borderDefault: "#2a2a28",
      accentPrimary: "#ff6142",
      accentInk: "#111110",
      statusSuccess: "#3dd68c",
      statusWarning: "#fbbf24",
      statusDanger: "#f87171",
    },
  },
  {
    id: "clinical-slate-cobalt",
    code: "03",
    name: "ISO Precision Lab",
    subtitle: "Clinical Slate & Cobalt",
    inspiration: "Cool analytical slate with precision cobalt blue for laboratory software trust.",
    light: {
      bgCanvas: "#f6f8fa",
      bgSurface: "#eaeef2",
      bgElevated: "#ffffff",
      textPrimary: "#0b0f17",
      textSecondary: "#24292f",
      textMuted: "#57606a",
      borderDefault: "#d0d7de",
      accentPrimary: "#0052ff",
      accentInk: "#ffffff",
      statusSuccess: "#0d7a5f",
      statusWarning: "#d97706",
      statusDanger: "#cf222e",
    },
    dark: {
      bgCanvas: "#090d14",
      bgSurface: "#111722",
      bgElevated: "#182030",
      textPrimary: "#f0f6fc",
      textSecondary: "#9ca3af",
      textMuted: "#6b7280",
      borderDefault: "#263042",
      accentPrimary: "#3b82f6",
      accentInk: "#ffffff",
      statusSuccess: "#34d399",
      statusWarning: "#fbbf24",
      statusDanger: "#f87171",
    },
  },
  {
    id: "bio-lims-emerald",
    code: "04",
    name: "Bio-LIMS Botanical",
    subtitle: "Scientific & Organic",
    inspiration: "Mineral sage surfaces paired with high-contrast emerald for food & testing labs.",
    light: {
      bgCanvas: "#f3f6f4",
      bgSurface: "#e6ece8",
      bgElevated: "#ffffff",
      textPrimary: "#091410",
      textSecondary: "#23332c",
      textMuted: "#4b5e55",
      borderDefault: "#c8d5ce",
      accentPrimary: "#059669",
      accentInk: "#ffffff",
      statusSuccess: "#047857",
      statusWarning: "#d97706",
      statusDanger: "#dc2626",
    },
    dark: {
      bgCanvas: "#08100d",
      bgSurface: "#101c17",
      bgElevated: "#172821",
      textPrimary: "#ecfdf5",
      textSecondary: "#9bb5ab",
      textMuted: "#68857a",
      borderDefault: "#21382f",
      accentPrimary: "#10b981",
      accentInk: "#08100d",
      statusSuccess: "#34d399",
      statusWarning: "#fbbf24",
      statusDanger: "#f87171",
    },
  },
  {
    id: "industrial-monochrome",
    code: "05",
    name: "Technical Stone",
    subtitle: "Industrial Monochrome",
    inspiration: "Hardware-inspired cool stone and stark signal crimson.",
    light: {
      bgCanvas: "#ededeb",
      bgSurface: "#e2e2df",
      bgElevated: "#fafaf9",
      textPrimary: "#09090b",
      textSecondary: "#27272a",
      textMuted: "#52525b",
      borderDefault: "#c8c8c4",
      accentPrimary: "#d92d20",
      accentInk: "#ffffff",
      statusSuccess: "#15803d",
      statusWarning: "#eab308",
      statusDanger: "#b91c1c",
    },
    dark: {
      bgCanvas: "#09090b",
      bgSurface: "#141417",
      bgElevated: "#1f1f23",
      textPrimary: "#f4f4f5",
      textSecondary: "#a1a1aa",
      textMuted: "#71717a",
      borderDefault: "#27272a",
      accentPrimary: "#f04438",
      accentInk: "#ffffff",
      statusSuccess: "#4ade80",
      statusWarning: "#facc15",
      statusDanger: "#f87171",
    },
  },
];

function clonePreset(preset: PalettePreset): { light: PaletteTokens; dark: PaletteTokens } {
  return {
    light: { ...preset.light },
    dark: { ...preset.dark },
  };
}

function normalizeHex(input: string): string | null {
  const cleaned = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const [r, g, b] = cleaned.split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned.toLowerCase()}`;
  }
  return null;
}

function hexToRgb(hex: string): [number, number, number] {
  const norm = normalizeHex(hex) ?? "#000000";
  const num = parseInt(norm.slice(1), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const s = channel / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  const bright = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (bright + 0.05) / (dark + 0.05);
}

function gradeContrast(ratio: number): { label: string; tone: "pass" | "warn" | "fail" } {
  if (ratio >= 7.0) return { label: "AAA 7.0+", tone: "pass" };
  if (ratio >= 4.5) return { label: "AA 4.5+", tone: "pass" };
  if (ratio >= 3.0) return { label: "AA Large 3.0+", tone: "warn" };
  return { label: "FAIL < 3.0", tone: "fail" };
}

function readableOn(bgHex: string): string {
  const onDark = contrastRatio("#0a0a0a", bgHex);
  const onLight = contrastRatio("#ffffff", bgHex);
  return onDark >= onLight ? "#0a0a0a" : "#ffffff";
}

function tokensToCssVars(t: PaletteTokens): Record<string, string> {
  return {
    "--black": t.bgCanvas,
    "--white": t.textPrimary,
    "--gray-1": t.textSecondary,
    "--gray-2": t.borderDefault,
    "--gray-3": t.bgSurface,
    "--live": t.statusSuccess,
    "--red": t.accentPrimary,
    "--paper": t.bgCanvas,
    "--paper2": t.bgSurface,
    "--ink": t.textPrimary,
    "--ink-pure": t.textPrimary,
    "--mut": t.textMuted,
    "--acc": t.accentPrimary,
    "--acc-ink": t.accentInk,
    "--ok": t.statusSuccess,
    "--hi": t.statusWarning,
    "--err": t.statusDanger,
    "--bg-canvas": t.bgCanvas,
    "--bg-surface": t.bgSurface,
    "--bg-elevated": t.bgElevated,
    "--text-primary": t.textPrimary,
    "--text-secondary": t.textSecondary,
    "--text-muted": t.textMuted,
    "--border-default": t.borderDefault,
    "--border-strong": t.textPrimary,
    "--accent-primary": t.accentPrimary,
    "--accent-ink": t.accentInk,
    "--status-success": t.statusSuccess,
    "--status-warning": t.statusWarning,
    "--status-danger": t.statusDanger,
  };
}

const ALL_MANAGED_VARS = Object.keys(tokensToCssVars(PRESETS[0].light));

function buildCssExport(paletteName: string, light: PaletteTokens, dark: PaletteTokens): string {
  return `/* ${paletteName} — Generated from /styleguide */
:root {
  /* Tier 2 Semantic Tokens */
  --bg-canvas: ${light.bgCanvas};
  --bg-surface: ${light.bgSurface};
  --bg-elevated: ${light.bgElevated};
  --text-primary: ${light.textPrimary};
  --text-secondary: ${light.textSecondary};
  --text-muted: ${light.textMuted};
  --border-default: ${light.borderDefault};
  --border-strong: ${light.textPrimary};
  --accent-primary: ${light.accentPrimary};
  --accent-ink: ${light.accentInk};
  --status-success: ${light.statusSuccess};
  --status-warning: ${light.statusWarning};
  --status-danger: ${light.statusDanger};

  /* Legacy Aliases (Tandem / Subpage Compatibility) */
  --black: var(--bg-canvas);
  --white: var(--text-primary);
  --gray-1: var(--text-secondary);
  --gray-2: var(--border-default);
  --gray-3: var(--bg-surface);
  --live: var(--status-success);
  --red: var(--accent-primary);
  --paper: var(--bg-canvas);
  --paper2: var(--bg-surface);
  --ink: var(--text-primary);
  --ink-pure: var(--text-primary);
  --mut: var(--text-muted);
  --acc: var(--accent-primary);
  --acc-ink: var(--accent-ink);
  --ok: var(--status-success);
  --hi: var(--status-warning);
  --err: var(--status-danger);
}

:root[data-theme="dark"] {
  --bg-canvas: ${dark.bgCanvas};
  --bg-surface: ${dark.bgSurface};
  --bg-elevated: ${dark.bgElevated};
  --text-primary: ${dark.textPrimary};
  --text-secondary: ${dark.textSecondary};
  --text-muted: ${dark.textMuted};
  --border-default: ${dark.borderDefault};
  --border-strong: ${dark.textPrimary};
  --accent-primary: ${dark.accentPrimary};
  --accent-ink: ${dark.accentInk};
  --status-success: ${dark.statusSuccess};
  --status-warning: ${dark.statusWarning};
  --status-danger: ${dark.statusDanger};
}`;
}

function buildDtcgJsonExport(paletteName: string, light: PaletteTokens, dark: PaletteTokens): string {
  const mapGroup = (t: PaletteTokens) =>
    Object.fromEntries(
      TOKEN_META.map((m) => [
        m.cssVar.replace(/^--/, ""),
        {
          $value: t[m.key],
          $type: "color",
          $description: m.role,
        },
      ]),
    );

  return JSON.stringify(
    {
      $schema: "https://tr.designtokens.org/format/",
      palette: paletteName,
      color: {
        light: mapGroup(light),
        dark: mapGroup(dark),
      },
    },
    null,
    2,
  );
}

function buildMarkdownExport(paletteName: string, light: PaletteTokens, dark: PaletteTokens): string {
  const header = `## ${paletteName} Color Specification\n\n| Token | Legacy Alias | Light | Dark | Light Contrast | Dark Contrast | Role |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- |`;
  const rows = TOKEN_META.map((m) => {
    const bgLight = m.contrastAgainst === "accentPrimary" ? light.accentPrimary : light.bgCanvas;
    const bgDark = m.contrastAgainst === "accentPrimary" ? dark.accentPrimary : dark.bgCanvas;
    const lRatio =
      m.contrastAgainst != null ? `${contrastRatio(light[m.key], bgLight).toFixed(2)}:1` : "—";
    const dRatio =
      m.contrastAgainst != null ? `${contrastRatio(dark[m.key], bgDark).toFixed(2)}:1` : "—";
    return `| \`${m.cssVar}\` | \`${m.legacyAlias}\` | \`${light[m.key]}\` | \`${dark[m.key]}\` | ${lRatio} | ${dRatio} | ${m.role} |`;
  });
  return [header, ...rows].join("\n");
}

function ModePreviewCard({
  label,
  modeName,
  tokens,
}: {
  label: string;
  modeName: string;
  tokens: PaletteTokens;
}) {
  const styleVars = tokensToCssVars(tokens) as CSSProperties;
  return (
    <div className="sg-mode-frame" style={styleVars}>
      <div className="sg-mode-top">
        <span>{label}</span>
        <span className="tag ok">● {modeName}</span>
      </div>
      <div>
        <h3
          style={{
            fontSize: "clamp(24px, 2.4vw, 32px)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            color: "var(--text-primary)",
          }}
        >
          The <em className="claim">no guesswork</em> quotation engine.
        </h3>
        <p style={{ marginTop: 10, fontSize: 14.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Prices, taxes and turnaround times come strictly from your laboratory LIMS database.
        </p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button type="button" className="btn solid btn-sm">
          Request pilot →
        </button>
        <button type="button" className="btn btn-sm">
          See live demo
        </button>
        <button type="button" className="btn ghost btn-sm">
          Ghost action
        </button>
      </div>
      <div className="ai-analysis-card">
        <div className="ai-card-header">
          <div className="ai-card-title">
            <span className="ai-pulse-dot" />
            <span>LIMS Verification</span>
          </div>
          <span className="ai-confidence-pill">99.4% Match</span>
        </div>
        <div className="ai-card-matrix">
          <div className="ai-card-row">
            <span className="ai-k">Matrix</span>
            <span className="ai-v bold">Basmati Rice · Export</span>
          </div>
          <div className="ai-card-row">
            <span className="ai-k">Rate Card</span>
            <span className="ai-v verified-badge">✓ Verified Tier-2</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StyleguideWorkbench() {
  const [presetId, setPresetId] = useState<string>(PRESETS[0].id);
  const [mode, setMode] = useState<ThemeMode>("light");
  const [palette, setPalette] = useState<{ light: PaletteTokens; dark: PaletteTokens }>(() =>
    clonePreset(PRESETS[0]),
  );
  const [persistSite, setPersistSite] = useState<boolean>(false);
  const [exportTab, setExportTab] = useState<ExportTab>("css");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hexDrafts, setHexDrafts] = useState<Partial<Record<TokenKey, string>>>({});
  const [hydrated, setHydrated] = useState<boolean>(false);

  const persistRef = useRef<boolean>(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    persistRef.current = persistSite;
  }, [persistSite]);

  // Restore saved theme mode and optional persisted preview state once on mount.
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("tandem-theme");
      if (savedTheme === "dark") {
        setMode("dark");
      }
      const savedStateRaw = localStorage.getItem(PREVIEW_STATE_KEY);
      if (savedStateRaw) {
        const parsed = JSON.parse(savedStateRaw) as {
          presetId?: string;
          palette?: { light: PaletteTokens; dark: PaletteTokens };
          persistSite?: boolean;
        };
        if (parsed.presetId) setPresetId(parsed.presetId);
        if (parsed.palette?.light && parsed.palette?.dark) setPalette(parsed.palette);
        if (parsed.persistSite) {
          persistRef.current = true;
          setPersistSite(true);
        }
      }
    } catch {
      // Ignore storage access errors.
    } finally {
      setHydrated(true);
    }

    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (!persistRef.current) {
        const root = document.documentElement;
        for (const cssVar of ALL_MANAGED_VARS) {
          root.style.removeProperty(cssVar);
        }
        try {
          localStorage.removeItem(PREVIEW_VARS_KEY);
          localStorage.removeItem(PREVIEW_STATE_KEY);
        } catch {
          // Ignore storage errors.
        }
        refreshTheme();
      }
    };
  }, []);

  // Synchronize live CSS variables onto :root whenever palette, mode, or persistence changes.
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    if (mode === "dark") {
      root.dataset.theme = "dark";
    } else {
      delete root.dataset.theme;
    }

    const activeTokens = palette[mode];
    const cssVars = tokensToCssVars(activeTokens);
    for (const [k, v] of Object.entries(cssVars)) {
      root.style.setProperty(k, v);
    }

    try {
      localStorage.setItem("tandem-theme", mode);
      if (persistSite) {
        localStorage.setItem(
          PREVIEW_VARS_KEY,
          JSON.stringify({
            light: tokensToCssVars(palette.light),
            dark: tokensToCssVars(palette.dark),
          }),
        );
        localStorage.setItem(
          PREVIEW_STATE_KEY,
          JSON.stringify({
            presetId,
            palette,
            persistSite: true,
          }),
        );
      } else {
        localStorage.removeItem(PREVIEW_VARS_KEY);
        localStorage.removeItem(PREVIEW_STATE_KEY);
      }
    } catch {
      // Ignore storage errors.
    }

    refreshTheme();
  }, [hydrated, mode, palette, persistSite, presetId]);

  const activePreset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  const activeTokens = palette[mode];

  function selectPreset(preset: PalettePreset) {
    setPresetId(preset.id);
    setPalette(clonePreset(preset));
    setHexDrafts({});
  }

  function updateToken(key: TokenKey, hexValue: string) {
    const normalized = normalizeHex(hexValue);
    if (!normalized) return;
    setPalette((prev) => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        [key]: normalized,
      },
    }));
  }

  function handleReset() {
    setPresetId(PRESETS[0].id);
    setPalette(clonePreset(PRESETS[0]));
    setPersistSite(false);
    setHexDrafts({});
    const root = document.documentElement;
    for (const cssVar of ALL_MANAGED_VARS) {
      root.style.removeProperty(cssVar);
    }
    try {
      localStorage.removeItem(PREVIEW_VARS_KEY);
      localStorage.removeItem(PREVIEW_STATE_KEY);
    } catch {
      // Ignore storage errors.
    }
    refreshTheme();
  }

  function triggerCopy(id: string, text: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedId(id);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedId(null), 1800);
  }

  const contrastRows = useMemo(() => {
    const testPairs: Array<{
      label: string;
      target: string;
      fgKey: TokenKey;
      bgKey: TokenKey;
      isAccentCheck?: boolean;
    }> = [
      {
        label: "--text-primary on --bg-canvas",
        target: "AAA >= 7.0:1 (Headings & body)",
        fgKey: "textPrimary",
        bgKey: "bgCanvas",
      },
      {
        label: "--text-secondary on --bg-canvas",
        target: "AA >= 4.5:1 (Lede & descriptions)",
        fgKey: "textSecondary",
        bgKey: "bgCanvas",
      },
      {
        label: "--text-muted on --bg-canvas",
        target: "AA >= 4.5:1 (Metadata & captions)",
        fgKey: "textMuted",
        bgKey: "bgCanvas",
      },
      {
        label: "--text-primary on --bg-surface",
        target: "AA >= 4.5:1 (Cards & panels)",
        fgKey: "textPrimary",
        bgKey: "bgSurface",
      },
      {
        label: "--accent-ink on --accent-primary",
        target: "AA Large >= 3.0:1 / AA >= 4.5:1",
        fgKey: "accentInk",
        bgKey: "accentPrimary",
        isAccentCheck: true,
      },
      {
        label: "--status-success on --bg-canvas",
        target: "AA >= 4.5:1 (LIMS verified pills)",
        fgKey: "statusSuccess",
        bgKey: "bgCanvas",
      },
      {
        label: "--status-danger on --bg-canvas",
        target: "AA >= 4.5:1 (Form errors & alerts)",
        fgKey: "statusDanger",
        bgKey: "bgCanvas",
      },
    ];

    return testPairs.map((pair) => {
      const lightRatio = contrastRatio(palette.light[pair.fgKey], palette.light[pair.bgKey]);
      const darkRatio = contrastRatio(palette.dark[pair.fgKey], palette.dark[pair.bgKey]);
      const lightGrade = gradeContrast(lightRatio);
      const darkGrade = gradeContrast(darkRatio);

      let note = "";
      if (pair.isAccentCheck) {
        const bgHex = activeTokens.accentPrimary;
        const onWhite = contrastRatio("#ffffff", bgHex);
        const onDark = contrastRatio("#0a0a0a", bgHex);
        const better = onDark > onWhite ? "#0a0a0a" : "#ffffff";
        note = `On ${bgHex}: #ffffff = ${onWhite.toFixed(2)}:1, #0a0a0a = ${onDark.toFixed(2)}:1 (recommended: ${better})`;
      }

      return {
        ...pair,
        lightRatio,
        darkRatio,
        lightGrade,
        darkGrade,
        note,
      };
    });
  }, [palette, activeTokens.accentPrimary]);

  const exportText = useMemo(() => {
    const label = `${activePreset.code} · ${activePreset.name}`;
    if (exportTab === "css") return buildCssExport(label, palette.light, palette.dark);
    if (exportTab === "json") return buildDtcgJsonExport(label, palette.light, palette.dark);
    return buildMarkdownExport(label, palette.light, palette.dark);
  }, [activePreset.code, activePreset.name, exportTab, palette.dark, palette.light]);

  return (
    <div className="sg-page">
      {/* Header */}
      <section className="sg-head">
        <div className="wrap">
          <div className="sg-head-row">
            <div>
              <div className="kicker">
                <span>DESIGN SYSTEM</span>
                COSMIQ-OS-WEB · COLOR WORKBENCH
              </div>
              <h1>Color &amp; Token Styleguide</h1>
              <p className="sg-head-sub">
                Switch between 5 industry-standard palettes, fine-tune individual semantic tokens, inspect live WCAG
                2.1 contrast ratios across Light and Dark modes, and export production CSS or W3C Design Tokens.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/" className="btn btn-sm">
                ← Preview Home
              </Link>
              <Link href="/demo" className="btn btn-sm">
                Preview Demo →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Workbench Control Bar */}
      <div className="sg-toolbar" role="region" aria-label="Palette controls">
        <div className="wrap sg-toolbar-inner">
          <div className="sg-presets" role="group" aria-label="Color palette presets">
            {PRESETS.map((preset) => {
              const previewSet = preset[mode];
              const isSelected = preset.id === presetId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`sg-preset-btn${isSelected ? " active" : ""}`}
                  onClick={() => selectPreset(preset)}
                  title={preset.inspiration}
                >
                  <span className="sg-dots" aria-hidden="true">
                    <span className="sg-dot" style={{ background: previewSet.bgCanvas }} />
                    <span className="sg-dot" style={{ background: previewSet.textPrimary }} />
                    <span className="sg-dot" style={{ background: previewSet.accentPrimary }} />
                  </span>
                  <span>
                    {preset.code} · {preset.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="sg-controls">
            <div className="sg-seg" role="group" aria-label="Theme mode">
              <button
                type="button"
                className={mode === "light" ? "active" : ""}
                onClick={() => setMode("light")}
              >
                Light
              </button>
              <button
                type="button"
                className={mode === "dark" ? "active" : ""}
                onClick={() => setMode("dark")}
              >
                Dark
              </button>
            </div>

            <label className="sg-persist">
              <input
                type="checkbox"
                checked={persistSite}
                onChange={(e) => setPersistSite(e.target.checked)}
              />
              <span>Persist across site</span>
            </label>

            <button type="button" className="btn ghost btn-sm" onClick={handleReset}>
              Reset
            </button>

            <button
              type="button"
              className="btn solid btn-sm"
              onClick={() =>
                triggerCopy(
                  "toolbar-css",
                  buildCssExport(`${activePreset.code} · ${activePreset.name}`, palette.light, palette.dark),
                )
              }
            >
              {copiedId === "toolbar-css" ? "Copied CSS ✓" : "Copy CSS"}
            </button>
          </div>
        </div>
      </div>

      {/* Section 01: Semantic Color Swatches & Live Pickers */}
      <section className="sg-section">
        <div className="wrap">
          <div className="sg-section-head">
            <div>
              <div className="sg-eyebrow">01 · Semantic Tokens ({mode.toUpperCase()} MODE)</div>
              <h2>
                {activePreset.name} — {activePreset.subtitle}
              </h2>
            </div>
            <p>{activePreset.inspiration}</p>
          </div>

          <div className="sg-swatch-grid">
            {TOKEN_META.map((meta) => {
              const hex = activeTokens[meta.key];
              const displayInput = hexDrafts[meta.key] ?? hex;
              const labelColor = readableOn(hex);
              const refBg =
                meta.contrastAgainst === "accentPrimary" ? activeTokens.accentPrimary : activeTokens.bgCanvas;
              const ratio = meta.contrastAgainst ? contrastRatio(hex, refBg) : null;
              const grade = ratio != null ? gradeContrast(ratio) : null;

              return (
                <div key={meta.key} className="sg-swatch-card">
                  <div className="sg-swatch-block" style={{ background: hex }}>
                    <span
                      className="sg-swatch-sample"
                      style={{
                        color: labelColor,
                        border: `1px solid ${labelColor}`,
                      }}
                    >
                      {meta.category.toUpperCase()}
                    </span>
                    <span
                      className="sg-swatch-sample"
                      style={{
                        color: labelColor,
                      }}
                    >
                      {hex.toUpperCase()}
                    </span>
                  </div>

                  <div className="sg-swatch-body">
                    <div className="sg-token-meta">
                      <span className="sg-token-name">{meta.cssVar}</span>
                      {grade && ratio != null ? (
                        <span className={`sg-badge ${grade.tone}`}>
                          {ratio.toFixed(2)}:1 · {grade.label}
                        </span>
                      ) : null}
                    </div>
                    <div className="sg-token-alias">Alias: {meta.legacyAlias}</div>
                    <p className="sg-token-role">{meta.role}</p>

                    <div className="sg-picker-row">
                      <input
                        type="color"
                        className="sg-color-input"
                        aria-label={`Pick color for ${meta.cssVar}`}
                        value={normalizeHex(hex) ?? "#000000"}
                        onChange={(e) => {
                          setHexDrafts((prev) => {
                            const next = { ...prev };
                            delete next[meta.key];
                            return next;
                          });
                          updateToken(meta.key, e.target.value);
                        }}
                      />
                      <input
                        type="text"
                        className="sg-hex-input"
                        aria-label={`Hex value for ${meta.cssVar}`}
                        value={displayInput}
                        maxLength={7}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setHexDrafts((prev) => ({ ...prev, [meta.key]: raw }));
                          if (/^#[0-9a-fA-F]{6}$/.test(raw.trim())) {
                            updateToken(meta.key, raw);
                          }
                        }}
                        onBlur={() => {
                          const draft = hexDrafts[meta.key];
                          if (draft) {
                            const normalized = normalizeHex(draft);
                            if (normalized) updateToken(meta.key, normalized);
                          }
                          setHexDrafts((prev) => {
                            const next = { ...prev };
                            delete next[meta.key];
                            return next;
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 02: Accessibility & Contrast Matrix */}
      <section className="sg-section">
        <div className="wrap">
          <div className="sg-section-head">
            <div>
              <div className="sg-eyebrow">02 · WCAG 2.1 Audit</div>
              <h2>Accessibility &amp; Contrast Matrix</h2>
            </div>
            <p>
              Real-time luminance check across both Light and Dark modes. Body copy requires &ge; 4.5:1 (AA); bold CTA
              labels and UI borders require &ge; 3.0:1.
            </p>
          </div>

          <div className="sg-table-wrap">
            <table className="sg-matrix-table">
              <thead>
                <tr>
                  <th>Token Pairing</th>
                  <th>Target Standard</th>
                  <th>Light Mode</th>
                  <th>Dark Mode</th>
                  <th>Guidance</th>
                </tr>
              </thead>
              <tbody>
                {contrastRows.map((row) => (
                  <tr key={row.label}>
                    <td>
                      <div className="mono" style={{ fontWeight: 700, fontSize: 12.5, color: "var(--text-primary)" }}>
                        {row.label}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{row.target}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span
                          className="sg-pair-chip"
                          style={{
                            background: palette.light[row.bgKey],
                            color: palette.light[row.fgKey],
                          }}
                        >
                          Aa
                        </span>
                        <span className={`sg-badge ${row.lightGrade.tone}`}>
                          {row.lightRatio.toFixed(2)}:1 · {row.lightGrade.label}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span
                          className="sg-pair-chip"
                          style={{
                            background: palette.dark[row.bgKey],
                            color: palette.dark[row.fgKey],
                          }}
                        >
                          Aa
                        </span>
                        <span className={`sg-badge ${row.darkGrade.tone}`}>
                          {row.darkRatio.toFixed(2)}:1 · {row.darkGrade.label}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 12.5 }}>
                      {row.note || "60-30-10 compliant"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 03: Side-by-Side Light vs Dark Mode Preview */}
      <section className="sg-section">
        <div className="wrap">
          <div className="sg-section-head">
            <div>
              <div className="sg-eyebrow">03 · Dual-Theme Comparison</div>
              <h2>Side-by-Side Light vs. Dark Mode</h2>
            </div>
            <p>
              Both modes rendered simultaneously with your active palette tokens so you can verify brand continuity
              without toggling back and forth.
            </p>
          </div>

          <div className="sg-compare-grid">
            <ModePreviewCard label="LIGHT MODE (:root)" modeName="Light Active" tokens={palette.light} />
            <ModePreviewCard
              label='DARK MODE (:root[data-theme="dark"])'
              modeName="Dark Active"
              tokens={palette.dark}
            />
          </div>
        </div>
      </section>

      {/* Section 04: Live CosmIQ Component Stress-Test */}
      <section className="sg-section">
        <div className="wrap">
          <div className="sg-section-head">
            <div>
              <div className="sg-eyebrow">04 · Production UI Components</div>
              <h2>Live CosmIQ Component Stress-Test</h2>
            </div>
            <p>
              Actual production CSS classes from <code>app/globals.css</code> reacting to your selected palette in real
              time.
            </p>
          </div>

          <div className="sg-stress-grid">
            {/* Typography & Interactive Actions */}
            <div className="sg-stress-box">
              <div className="sg-stress-title">Typography Scale &amp; Accent Claim</div>
              <div className="mega" style={{ fontSize: "clamp(38px, 4.5vw, 60px)", color: "var(--text-primary)" }}>
                COSMIQ OS
              </div>
              <h3 className="h2" style={{ fontSize: "clamp(28px, 3.2vw, 44px)" }}>
                Not a <em className="claim">guess.</em>
              </h3>
              <p className="lede" style={{ fontSize: 17 }}>
                <b>Your LIMS stays the source of truth.</b> Deterministic business logic computes{" "}
                <span className="mono">prices, taxes &amp; TAT</span>.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <button type="button" className="btn solid">
                  Primary Solid
                </button>
                <button type="button" className="btn">
                  Default Outline
                </button>
                <button type="button" className="btn ghost">
                  Ghost Button
                </button>
                <button type="button" className="btn btn-sm" disabled>
                  Disabled
                </button>
              </div>

              <div className="cmd" style={{ marginTop: 4 }}>
                <code>
                  <span className="prompt">$ </span>curl -s https://cosmiq-os.vercel.app/api/health
                </code>
                <button
                  type="button"
                  onClick={() => triggerCopy("cmd-copy", "curl -s https://cosmiq-os.vercel.app/api/health")}
                >
                  {copiedId === "cmd-copy" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Step 1 Terminal + Step 2 AI Card */}
            <div className="sg-stress-box">
              <div className="sg-stress-title">Workflow Terminal &amp; LIMS Verification Card</div>
              <div className="typed" style={{ minHeight: 118 }}>
                <span className="p">[WHATSAPP IN]</span> &quot;Need pesticide residue screen for 2 rice samples.&quot;
                {"\n"}
                <span className="p">[LIMS CHECK]</span> Querying catalogue: pesticide residue panel (rice){"\n"}
                <span className="p">[LIMS RESULT]</span> ✓ Method on file · TAT 5 working days
              </div>

              <div className="ai-analysis-card">
                <div className="ai-card-header">
                  <div className="ai-card-title">
                    <span className="ai-pulse-dot" />
                    <span>CosmIQ Entity &amp; LIMS Match</span>
                  </div>
                  <span className="ai-confidence-pill">99.4% Match</span>
                </div>
                <div className="ai-card-matrix">
                  <div className="ai-card-row">
                    <span className="ai-k">Sample Matrix</span>
                    <span className="ai-v bold">Basmati Rice (Export Grade)</span>
                  </div>
                  <div className="ai-card-row">
                    <span className="ai-k">Standard Method</span>
                    <span className="ai-v mono">AOAC 2007.01 · NABL</span>
                  </div>
                  <div className="ai-card-row status-highlight">
                    <span className="ai-k">LIMS Rate Card</span>
                    <span className="ai-v verified-badge">✓ Verified · Tier-2 Contract</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 Quotation Panel & Status Tags */}
            <div className="sg-stress-box">
              <div className="sg-stress-title">Quotation Panel, Status Tags &amp; Alerts</div>
              <div className="panel" style={{ background: "var(--bg-canvas)" }}>
                <div className="panel-h">
                  <span>● Quote #Q-0142</span>
                  <span>Awaiting approval</span>
                </div>
                <div className="panel-b">
                  <div className="quote">
                    <div className="quote-row">
                      <span>Pesticide residue panel × 2</span>
                      <span>from LIMS</span>
                    </div>
                    <div className="quote-row">
                      <span>GST @ 18%</span>
                      <span>backend logic</span>
                    </div>
                    <div className="quote-row total">
                      <span>TOTAL AMOUNT</span>
                      <span>₹ 9,440.00</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <span className="tag ok">● Verified LIMS</span>
                <span className="tag acc">Pending Approval</span>
                <span className="tag hi">ISO/IEC 17025</span>
              </div>

              <div className="formmsg ok">Quotation approved and queued for WhatsApp delivery.</div>
              <div className="formmsg err">Error: Customer GSTIN checksum failed LIMS validation.</div>
            </div>

            {/* Form Controls & Inverted Guardrail Banner */}
            <div className="sg-stress-box">
              <div className="sg-stress-title">Form Controls &amp; Inverted Guardrail Section</div>
              <div style={{ display: "grid", gap: 12 }}>
                <label className="f">
                  Laboratory Name
                  <input type="text" defaultValue="Apex Analytical & Food Testing Labs" readOnly />
                </label>
                <div className="checks">
                  <label>
                    <input type="checkbox" defaultChecked readOnly />
                    <span>WhatsApp Cloud API</span>
                  </label>
                  <label>
                    <input type="checkbox" readOnly />
                    <span>Read-only Replica</span>
                  </label>
                </div>
              </div>

              <div className="secure" style={{ padding: 24 }}>
                <h3 className="h2" style={{ fontSize: "clamp(22px, 2.4vw, 30px)", maxWidth: "18em" }}>
                  The AI never invents prices or test methods.
                </h3>
                <div className="secure-grid" style={{ marginTop: 20, gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "var(--black)" }}>
                      LIMS is sole source
                    </h4>
                    <p style={{ fontSize: 13.5 }}>Every test parameter is read directly from your database.</p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "var(--black)" }}>
                      Human in the loop
                    </h4>
                    <p style={{ fontSize: 13.5 }}>Staff inspect and approve every draft before sending.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 05: Export Industry-Standard Code & Spec */}
      <section className="sg-section">
        <div className="wrap">
          <div className="sg-section-head">
            <div>
              <div className="sg-eyebrow">05 · Production Export</div>
              <h2>Export CSS Variables, W3C Tokens &amp; Markdown Spec</h2>
            </div>
            <p>
              Copy the generated code straight into <code>app/globals.css</code> or <code>docs/DESIGN_SYSTEM.md</code>.
            </p>
          </div>

          <div className="sg-export-tabs">
            <div className="sg-seg" role="tablist" aria-label="Export format">
              <button
                type="button"
                role="tab"
                aria-selected={exportTab === "css"}
                className={exportTab === "css" ? "active" : ""}
                onClick={() => setExportTab("css")}
              >
                CSS Variables (:root)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={exportTab === "json"}
                className={exportTab === "json" ? "active" : ""}
                onClick={() => setExportTab("json")}
              >
                W3C Design Tokens (JSON)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={exportTab === "markdown"}
                className={exportTab === "markdown" ? "active" : ""}
                onClick={() => setExportTab("markdown")}
              >
                Markdown Spec
              </button>
            </div>

            <button
              type="button"
              className="btn solid btn-sm"
              onClick={() => triggerCopy("export-copy", exportText)}
            >
              {copiedId === "export-copy" ? "Copied Output ✓" : "Copy Output"}
            </button>
          </div>

          <pre className="sg-code-box">
            <code>{exportText}</code>
          </pre>
        </div>
      </section>
    </div>
  );
}
