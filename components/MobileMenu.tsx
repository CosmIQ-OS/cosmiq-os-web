"use client";
import { useEffect, useRef } from "react";

// <details> keeps the menu working without JS; this only closes it after a link
// tap, an outside tap or Escape, so it never sits on top of the page.
export default function MobileMenu({ links }: { links: { href: string; label: string }[] }) {
  const menu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const el = menu.current;
      if (el?.open && !el.contains(event.target as Node)) el.open = false;
    };
    const onKey = (event: KeyboardEvent) => {
      const el = menu.current;
      if (event.key !== "Escape" || !el?.open) return;
      el.open = false;
      el.querySelector("summary")?.focus();
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function closeOnLink(event: React.MouseEvent) {
    if ((event.target as HTMLElement).closest("a") && menu.current) menu.current.open = false;
  }

  return (
    <details className="mobile-menu" ref={menu}>
      <summary aria-label="Open navigation">MENU</summary>
      <nav aria-label="Mobile" onClick={closeOnLink}>
        {links.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
        <a href="/contact">Request a pilot</a>
      </nav>
    </details>
  );
}
