import type { Metadata } from "next";
import Link from "next/link";
import LeadForm from "@/components/LeadForm";
import WhatsAppIcon from "@/components/WhatsAppIcon";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Connect with CosmIQ OS to map which tasks belong to AI, which belong to your team, and start a safe, focused pilot.",
};

export default function Contact() {
  return (
    <section className="section">
      <div className="wrap cta-grid">
        <div className="aside">
          <p className="kicker">
            <span>Contact</span>Connect with CosmIQ OS
          </p>
          <h1>Let&apos;s map your first safe workflow.</h1>
          <p className="lede" style={{ marginBottom: 8 }}>
            Tell us where your team loses the most time — customer replies, quotations, data entry, or internal
            coordination. We&apos;ll reply with a clear, honest plan.
          </p>
          <ol>
            <li>We review your current process and bottlenecks.</li>
            <li>A short call to map what stays human and what AI can handle safely.</li>
            <li>A focused private pilot on real data — zero lock-in.</li>
          </ol>

          <div className="contact-links">
            <span className="contact-links-label">Direct WhatsApp</span>
            <div className="contact-links-row">
              <a
                href="https://wa.me/919847594827"
                target="_blank"
                rel="noopener noreferrer"
                className="btn solid btn-sm"
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <WhatsAppIcon size={16} />
                <span>Chat on WhatsApp: +91 98475 94827 →</span>
              </a>
            </div>

            <span className="contact-links-label" style={{ marginTop: 8 }}>
              Also available
            </span>
            <div className="contact-links-row">
              <Link href="/services" className="btn btn-sm">
                View our services
              </Link>
              <Link href="/demo" className="btn btn-sm ghost">
                Try live demo
              </Link>
            </div>
          </div>
        </div>
        <LeadForm />
      </div>
    </section>
  );
}
