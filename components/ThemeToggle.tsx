"use client";

import { useEffect, useState } from "react";
import { refreshTheme } from "@/lib/ascii";

type ThemeMode = "light" | "dark";

const PREVIEW_VARS_KEY = "cosmiq-preview-vars";

function applySavedPreviewVars(mode: ThemeMode) {
  try {
    const raw = localStorage.getItem(PREVIEW_VARS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, Record<string, string> | string>;
    const vars = (parsed[mode] ?? parsed) as Record<string, string>;
    if (!vars || typeof vars !== "object") return;
    const root = document.documentElement;
    for (const [key, val] of Object.entries(vars)) {
      if (key.startsWith("--") && typeof val === "string") {
        root.style.setProperty(key, val);
      }
    }
  } catch {
    // Ignore storage or JSON errors.
  }
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const readCurrent = (): ThemeMode => {
      if (document.documentElement.dataset.theme === "dark") return "dark";
      try {
        if (localStorage.getItem("tandem-theme") === "dark") return "dark";
      } catch {
        // Ignore storage errors.
      }
      return "light";
    };

    setMode(readCurrent());

    const onThemeEvent = (event: Event) => {
      const detail = (event as CustomEvent<ThemeMode>).detail;
      if (detail === "light" || detail === "dark") {
        setMode(detail);
      } else {
        setMode(readCurrent());
      }
    };

    window.addEventListener("cosmiq-theme-change", onThemeEvent);
    return () => window.removeEventListener("cosmiq-theme-change", onThemeEvent);
  }, []);

  function toggleTheme() {
    const next: ThemeMode = mode === "dark" ? "light" : "dark";
    const root = document.documentElement;
    if (next === "dark") {
      root.dataset.theme = "dark";
    } else {
      delete root.dataset.theme;
    }

    try {
      localStorage.setItem("tandem-theme", next);
    } catch {
      // Ignore storage errors.
    }

    applySavedPreviewVars(next);
    refreshTheme();
    setMode(next);
    window.dispatchEvent(new CustomEvent<ThemeMode>("cosmiq-theme-change", { detail: next }));
  }

  const nextLabel = mode === "dark" ? "Light" : "Dark";

  return (
    <button
      type="button"
      className="theme-btn"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextLabel.toLowerCase()} theme`}
      title={`Switch to ${nextLabel} mode`}
    >
      <span className="theme-btn-dot" aria-hidden="true" />
      <span>{nextLabel}</span>
    </button>
  );
}
