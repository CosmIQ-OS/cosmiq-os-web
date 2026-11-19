import type { Metadata } from "next";
import Link from "next/link";
import LeadForm from "@/components/LeadForm";

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
            <span className="contact-links-label">Also available</span>
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
