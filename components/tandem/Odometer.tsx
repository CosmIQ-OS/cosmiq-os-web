"use client";
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/ascii";

interface Props {
  target?: number;
  label?: string;
  icon?: boolean;
}

const TURNS = 4;
const ROLL = "transform 1.6s cubic-bezier(.16, 1, .3, 1)";

export default function Odometer({ target = 1482, label = "quotes verified", icon = true }: Props) {
  const [val, setVal] = useState<number | null>(null);
  const containerRef = useRef<HTMLParagraphElement>(null);
  const fmt = new Intl.NumberFormat("en");

  useEffect(() => {
    const reduced = prefersReducedMotion();
    if (reduced) {
      setVal(target);
      return;
    }
    // Listen for the intro signal from the splash screen or fallback timer
    const onIntro = () => {
      setTimeout(() => setVal(target), 400);
    };
    window.addEventListener("cosmiq:intro", onIntro);
    const fallback = setTimeout(() => {
      setVal(target);
    }, 1100);

    return () => {
      window.removeEventListener("cosmiq:intro", onIntro);
      clearTimeout(fallback);
    };
  }, [target]);

  const text = fmt.format(val ?? 0);
  const digits = text.replace(/\D/g, "");

  return (
    <p ref={containerRef} className="dl-count intro" data-downloads style={{ "--i": 5 } as any}>
      {icon && (
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M8 1.5v9M4 7l4 4 4-4M2 14.5h12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span>
        <b aria-label={fmt.format(target)}>
          {val === null ? (
            <span>0</span>
          ) : (
            text.split("").map((ch, idx) => {
              if (!/\d/.test(ch)) {
                return (
                  <span key={idx} className="roll sep" aria-hidden="true">
                    {ch}
                  </span>
                );
              }
              const d = Number(ch);
              const digitIdx = digits.indexOf(ch);
              const spins = Math.max(0, digitIdx - (digits.length - 1) + (TURNS - 2));
              const row = d + spins * 10;
              return (
                <span key={idx} className="roll" aria-hidden="true">
                  <span
                    style={{
                      transform: `translateY(-${row * 1.25}em)`,
                      transition: prefersReducedMotion() ? "none" : ROLL,
                      transitionDelay: `${idx * 45}ms`,
                    }}
                  >
                    {Array.from({ length: TURNS * 10 }, (_, n) => (
                      <i key={n}>{n % 10}</i>
                    ))}
                  </span>
                </span>
              );
            })
          )}
        </b>{" "}
        {label}
      </span>
    </p>
  );
}
