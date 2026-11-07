"use client";
import { useEffect, useRef } from "react";
import { fitWidest, prefersReducedMotion } from "@/lib/ascii";

export default function FooterWordmark({ word = "CosmIQ" }: { word?: string }) {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const reduced = prefersReducedMotion();
    const letters = Array.from(el.querySelectorAll<HTMLSpanElement>(".foot-char"));

    function bakeKerning() {
      letters.forEach((l) => {
        l.style.marginRight = "";
      });
      el!.style.fontKerning = "none";
      const probe = document.createElement("span");
      Object.assign(probe.style, {
        position: "absolute",
        visibility: "hidden",
        whiteSpace: "pre",
        fontSize: "200px",
      });
      el!.appendChild(probe);

      const width = (text: string, kerning: string) => {
        probe.style.fontKerning = kerning;
        probe.textContent = text;
        return probe.getBoundingClientRect().width;
      };

      letters.forEach((l, i) => {
        const next = letters[i + 1];
        if (!next) return;
        const pair = (l.textContent || "") + (next.textContent || "");
        const kern = width(pair, "normal") - width(pair, "none");
        if (Math.abs(kern) > 0.01) {
          l.style.marginRight = (kern / 200).toFixed(4) + "em";
        }
      });
      probe.remove();
    }

    let w = 125,
      target = 125,
      shownW = -1,
      rippleAt = -1e9,
      rippleFrom = 0;
    let visible = false,
      running = false,
      last = 0;
    const dipping = new Set<HTMLElement>();

    const refit = () => {
      bakeKerning();
      fitWidest(el!);
    };

    refit();
    document.fonts?.ready.then(refit);

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      target = 62 + 63 * (e.clientX / window.innerWidth);
      wake();
    };

    const RIPPLE_S = 0.85 + (letters.length - 1) * 0.1;
    const ripple = (from: number) => {
      rippleFrom = from;
      rippleAt = performance.now();
      wake();
    };

    const onPointerDown = (e: PointerEvent) => {
      const idx = letters.findIndex((l) => {
        const r = l.getBoundingClientRect();
        return e.clientX < r.right;
      });
      ripple(idx < 0 ? letters.length - 1 : idx);
    };

    function tick(now: number) {
      const dt = last ? Math.min(now - last, 64) : 16;
      last = now;
      w += (target - w) * (1 - Math.exp(-dt / 90));
      if (Math.abs(target - w) < 0.05) w = target;
      if (Math.abs(w - shownW) >= 0.05) {
        el!.style.fontVariationSettings = `"wdth" ${w.toFixed(1)}`;
        shownW = w;
      }
      const t = (now - rippleAt) / 1000;
      letters.forEach((l, i) => {
        const p = (t - Math.abs(i - rippleFrom) * 0.1) / 0.85;
        if (p <= 0 || p >= 1) {
          if (dipping.delete(l)) {
            l.style.fontVariationSettings = l.style.fontWeight = "";
          }
          return;
        }
        const dip = Math.pow(Math.sin(p * Math.PI), 2);
        l.style.fontVariationSettings = `"wdth" ${Math.max(62, w - 60 * dip).toFixed(1)}`;
        l.style.fontWeight = (900 - 650 * dip).toFixed(0);
        dipping.add(l);
      });
      const moving = w !== target || t < RIPPLE_S || dipping.size > 0;
      if (visible && moving) {
        requestAnimationFrame(tick);
      } else {
        running = false;
        last = 0;
      }
    }

    function wake() {
      if (reduced || !visible || running) return;
      running = true;
      requestAnimationFrame(tick);
    }

    el.parentElement?.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", refit);

    let io1: IntersectionObserver | null = null;
    let io2: IntersectionObserver | null = null;

    if (!reduced) {
      io1 = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        wake();
      });
      io1.observe(el);

      io2 = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) ripple((letters.length - 1) / 2);
        },
        { threshold: 0.6 }
      );
      io2.observe(el);
    }

    return () => {
      el.parentElement?.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", refit);
      io1?.disconnect();
      io2?.disconnect();
    };
  }, []);

  return (
    <div ref={elRef} className="foot-word mega" id="footWord" aria-hidden="true">
      {word.split("").map((ch, idx) => (
        <span key={idx} className="foot-char">
          {ch}
        </span>
      ))}
    </div>
  );
}

