import Link from "next/link";
import GrowthDiagram from "@/components/GrowthDiagram";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { SECURITY_PILLARS, VISION_BOUNDARY } from "@/lib/services";

export default function Home() {
  return (
    <>
      {/* Block 1: Above-the-Fold Hero — Visual Equation Diagram + Copy & Thumb-Zone Buttons */}
      <section className="min-hero" id="top" aria-labelledby="heroTitle">
        <div className="wrap min-hero-wrap">
          <div className="min-hero-grid">
            <div className="min-hero-copy">
              <p className="min-eyebrow">
                <span className="min-eyebrow-dot" aria-hidden="true" />
                Safe AI Automation for Businesses
              </p>

              <h1 className="min-hero-title" id="heroTitle">
                Automate the routine.
                <span className="min-hero-accent">Keep the human craft.</span>
              </h1>

              <p className="min-hero-sub">
                Most businesses lose hours to repetitive work — and lose customers to slow replies. We help you identify{" "}
                <strong>where AI belongs</strong> and <strong>where human effort belongs</strong>, then build secure AI
                agents on top of the tools you already use.
              </p>

              <div className="min-ctas">
                <Link className="btn solid" href="/services">
                  View our services →
                </Link>
                <Link className="btn" href="/contact">
                  Contact us
                </Link>
                <a
                  className="btn ghost"
                  href="https://wa.me/919847594827"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat with CosmIQ OS on WhatsApp"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                >
                  <WhatsAppIcon size={16} />
                  <span>WhatsApp: +91 98475 94827</span>
                </a>
              </div>
            </div>

            <div className="min-hero-cube">
              <GrowthDiagram />
            </div>
          </div>

          <ul className="min-ledger" aria-label="Core guarantees">
            <li>
              <strong>24/7 Instant Intake</strong>
              <span>Works across WhatsApp, web &amp; your existing tools</span>
            </li>
            <li>
              <strong>0% AI Guesswork</strong>
              <span>Deterministic backend code calculates all numbers</span>
            </li>
            <li>
              <strong>100% Human Control</strong>
              <span>Your team approves what leaves the building</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Block 2: Our Vision Made Visual — AI vs. Human Boundary + Security Base */}
      <section className="min-section" id="vision" aria-labelledby="visionTitle">
        <div className="wrap">
          <div className="min-section-head">
            <p className="min-kicker">OUR VISION</p>
            <h2 className="min-h2" id="visionTitle">
              Put AI where it is safe, and humans where they matter.
            </h2>
            <p className="min-lede">
              AI shouldn&apos;t replace your team or guess your business rules. It should absorb mechanical work safely
              so your people can focus on customers, judgment, and growth.
            </p>
          </div>

          <div className="vision-split" role="region" aria-label="Human and AI responsibility split">
            <div className="vision-col vision-col-ai">
              <div className="vision-col-head">
                <span className="vision-tag">{VISION_BOUNDARY.ai.tag}</span>
                <h3>{VISION_BOUNDARY.ai.label}</h3>
              </div>
              <ul className="vision-list">
                {VISION_BOUNDARY.ai.items.map((item) => (
                  <li key={item}>
                    <span className="vision-pip vision-pip-ai" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="vision-col vision-col-human">
              <div className="vision-col-head">
                <span className="vision-tag vision-tag-human">{VISION_BOUNDARY.human.tag}</span>
                <h3>{VISION_BOUNDARY.human.label}</h3>
              </div>
              <ul className="vision-list">
                {VISION_BOUNDARY.human.items.map((item) => (
                  <li key={item}>
                    <span className="vision-pip vision-pip-human" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="security-band" aria-label="Security and reliability principles">
            <p className="security-label">IMPLEMENTED SAFELY WITH SECURITY</p>
            <div className="security-grid">
              {SECURITY_PILLARS.map((pillar) => (
                <div key={pillar.title} className="security-card">
                  <h3>{pillar.title}</h3>
                  <p>{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Block 3: Minimal Mantra Closer */}
      <section className="mantra-band" aria-labelledby="mantraTitle">
        <div className="wrap mantra-in">
          <h2 className="mantra-title" id="mantraTitle">
            <span>Cut the noise.</span>
            <span className="mantra-muted">Craft the core.</span>
            <span className="mantra-accent">Claim the growth.</span>
          </h2>
          <p className="mantra-sub">
            Start with one workflow. Test it safely on real data before scaling.
          </p>
          <div className="min-ctas">
            <Link className="btn solid" href="/services">
              View our services →
            </Link>
            <Link className="btn" href="/contact">
              Contact us
            </Link>
            <a
              className="btn ghost"
              href="https://wa.me/919847594827"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with CosmIQ OS on WhatsApp"
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <WhatsAppIcon size={16} />
              <span>WhatsApp: +91 98475 94827</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
