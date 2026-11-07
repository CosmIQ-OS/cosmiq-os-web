"use client";
import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/ascii";

export default function ScrollReveals() {
  useEffect(() => {
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) return;
    const root = document.documentElement;
    root.classList.add("rv");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("seen");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll("[data-rv]").forEach((el) => io.observe(el));

    const current = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          e.target.classList.toggle("cur", e.isIntersecting);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    document.querySelectorAll(".install-steps > li").forEach((li) => current.observe(li));

    // Also trigger hero intro state if splash was already dismissed or skipped
    const hero = document.getElementById("top");
    if (hero && !root.classList.contains("splash")) {
      hero.classList.add("in");
    }

    const onIntro = () => {
      hero?.classList.add("in");
    };
    window.addEventListener("cosmiq:intro", onIntro);

    return () => {
      io.disconnect();
      current.disconnect();
      window.removeEventListener("cosmiq:intro", onIntro);
    };
  }, []);

  return null;
}

