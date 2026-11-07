"use client";
import { useEffect, useRef } from "react";
import { clamp, fitWidest, prefersReducedMotion } from "@/lib/ascii";

interface Props {
  lines?: [string, string][];
  note?: string;
}

export default function Statement({
  lines = [
    ["Not a", "guess."],
    ["Not an", "AI hallucination."],
    ["Your real", "LIMS."],
  ],
  note = "Your LIMS stays the source of truth, so services, test parameters, turnaround times and prices work with zero guesswork. The agent coordinates customer requests in natural language, while deterministic code handles all the numbers.",
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const lineEls = Array.from(section.querySelectorAll<HTMLElement>(".st-line"));
    const full = new Map<HTMLElement, number>();
    const reduced = prefersReducedMotion();

    const fit = () =>
      lineEls.forEach((el) => {
        fitWidest(el);
        full.set(el, parseFloat(el.style.fontSize) || 100);
      });

    let shown = -1, target = 0, last = 0, ticking = false;

    const progress = () => {
      const r = section.getBoundingClientRect();
      const denom = r.height - window.innerHeight;
      if (denom <= 0) return 0;
      return clamp(-r.top / denom, 0, 1);
    };

    function draw(p: number) {
      lineEls.forEach((el, i) => {
        const k = reduced ? 1 : clamp(p * (lineEls.length + 0.5) - i, 0, 1);
        const e = 1 - Math.pow(1 - k, 3);
        const baseSize = full.get(el) || 100;
        el.style.fontSize = (baseSize * (0.26 + 0.74 * e)).toFixed(2) + "px";
        el.style.fontVariationSettings = `"wdth" ${(62 + 63 * e).toFixed(1)}`;
        el.style.color = `color-mix(in srgb, var(--white) ${(15 + 85 * e).toFixed(1)}%, var(--gray-2))`;
        el.classList.toggle("on", k >= 1);
      });
    }

    function tick(now: number) {
      const dt = Math.min(64, now - last);
      last = now;
      shown += (target - shown) * (1 - Math.exp(-dt / 90));
      if (Math.abs(target - shown) < 0.0005) shown = target;
      draw(shown);
      if (shown !== target) {
        requestAnimationFrame(tick);
      } else {
        ticking = false;
      }
    }

    function update() {
      target = progress();
      if (shown < 0 || reduced) {
        shown = target;
        draw(shown);
        return;
      }
      if (!ticking && shown !== target) {
        ticking = true;
        last = performance.now();
        requestAnimationFrame(tick);
      }
    }

    const refit = () => {
      fit();
      shown = progress();
      draw(shown);
    };

    fit();
    refit();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", refit);

    // Re-fit when fonts finish loading so wdth measurements are exact
    document.fonts?.ready.then(refit);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", refit);
    };
  }, []);

  return (
    <section ref={sectionRef} className="statement" id="statement" aria-label="Not a guess: your real LIMS">
      <div className="statement-pin">
        {lines.map(([first, second], i) => (
          <p key={i} className="st-line mega">
            <span>{first}</span> <span>{second}</span>
          </p>
        ))}
        <p className="lede st-note">{note}</p>
      </div>
    </section>
  );
}
