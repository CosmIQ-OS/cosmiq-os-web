"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Nav() {
  const [themeName, setThemeName] = useState<"Light" | "Dark">("Light");

  useEffect(() => {
    const root = document.documentElement;
    const currentTheme = root.dataset.theme === "light" ? "light" : "dark";
    setThemeName(currentTheme === "dark" ? "Light" : "Dark");

    const nav = document.querySelector(".nav") as HTMLElement | null;
    const secure = document.querySelector(".secure") as HTMLElement | null;
    let lastY = window.scrollY;

    const onScroll = () => {
      if (!nav) return;
      const y = window.scrollY;
      const h = nav.offsetHeight;
      if (secure) {
        const r = secure.getBoundingClientRect();
        nav.classList.toggle("inv", r.top < h / 2 && r.bottom > h / 2);
      }
      if (Math.abs(y - lastY) < 6) return;
      nav.classList.toggle("away", y > lastY && y > h);
      lastY = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    nav?.addEventListener("focusin", () => nav.classList.remove("away"));

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    try {
      localStorage.setItem("tandem-theme", next);
    } catch {}
    setThemeName(next === "dark" ? "Light" : "Dark");
  }

  return (
    <nav className="nav" aria-label="Main">
      <Link className="wordmark" href="/">
        CosmIQ
      </Link>
      <ul>
        <li>
          <Link className="nav-chai" href="/contact" aria-label="Request a pilot">
            <svg className="chai-glass" viewBox="0 0 16 16" aria-hidden="true">
              <path
                className="steam"
                d="M6.4 3.6c-.9-.8.9-1.5 0-2.4M9.6 3.6c-.9-.8.9-1.5 0-2.4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinecap="round"
              />
              <path
                d="M2.9 5.2h10.2l-1.2 9.1a1 1 0 0 1-1 .9H5.1a1 1 0 0 1-1-.9z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <path d="M3.8 8.6h8.4l-.8 5.6H4.6z" fill="currentColor" />
            </svg>
            <span>Request a pilot</span>
          </Link>
        </li>
        <li className="opt">
          <Link href="/#agents">Agents</Link>
        </li>
        <li className="opt">
          <Link href="/#workflow">How it works</Link>
        </li>
        <li className="opt">
          <Link href="/#guardrails">Guardrails</Link>
        </li>
        <li className="opt">
          <Link href="/#pilot">Pilot</Link>
        </li>
        <li>
          <Link href="/demo">Demo</Link>
        </li>
        <li>
          <button
            className="theme-btn"
            type="button"
            id="themeBtn"
            onClick={toggleTheme}
            aria-label={`Switch to ${themeName.toLowerCase()} theme`}
          >
            {themeName}
          </button>
        </li>
      </ul>
    </nav>
  );
}
