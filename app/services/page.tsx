import type { Metadata } from "next";
import Link from "next/link";
import { DELIVERY_STEPS, SERVICES } from "@/lib/services";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Practical AI agents, workflow automation, and business systems integration built safely on top of the tools your team already uses.",
};

export default function ServicesPage() {
  return (
    <>
      <section className="min-subhead" aria-labelledby="servicesTitle">
        <div className="wrap">
          <p className="min-kicker">SERVICES</p>
          <h1 className="min-sub-title" id="servicesTitle">
            Practical AI systems built around how your business already works.
          </h1>
          <p className="min-lede">
            We do not force you to replace your software or retrain your team. We connect to your existing systems,
            automate repetitive work safely, and keep your people in control.
          </p>
        </div>
      </section>

      <section className="min-section min-section-tight" aria-label="Service catalog">
        <div className="wrap">
          <div className="services-grid">
            {SERVICES.map((service) => (
              <article key={service.code} className="service-card">
                <div className="service-code">{service.code}</div>
                <h2>{service.title}</h2>
                <p>{service.summary}</p>
                <div className="service-guardrail">
                  <span className="trust-dot" aria-hidden="true" />
                  <span>{service.guardrail}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="min-section" aria-labelledby="deliveryTitle">
        <div className="wrap">
          <div className="min-section-head">
            <p className="min-kicker">HOW WE WORK</p>
            <h2 className="min-h2" id="deliveryTitle">
              Pilot first. Proven before it scales.
            </h2>
          </div>

          <ol className="delivery-grid">
            {DELIVERY_STEPS.map((item) => (
              <li key={item.step} className="delivery-card">
                <span className="delivery-num">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </li>
            ))}
          </ol>

          <div className="services-cta-bar">
            <div>
              <h3>Want to see deterministic AI in action?</h3>
              <p>
                Explore our live WhatsApp-to-Quotation prototype, or tell us about one workflow you want to automate
                safely.
              </p>
            </div>
            <div className="min-ctas">
              <Link className="btn solid" href="/contact">
                Contact us →
              </Link>
              <Link className="btn" href="/demo">
                Try live demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
