import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How CosmIQ OS handles business enquiries, data security, and automated workflows.",
};

export default function Privacy() {
  return (
    <section className="section">
      <div className="wrap">
        <p className="kicker">
          <span>Privacy</span>How we handle data
        </p>
        <h1>Privacy note.</h1>
        <div className="prose">
          <h3>Enquiries on this website</h3>
          <p>
            We collect your contact details and the areas you want to automate solely so we can respond to your enquiry.
            Submissions are stored in an internal database accessible only to authorised staff, never published
            publicly.
          </p>
          <h3>Client systems &amp; pilots</h3>
          <ul>
            <li>Each client&apos;s data stays strictly isolated to their own environment.</li>
            <li>
              We request only least-privilege access to the specific records an agreed workflow requires (such as
              catalogue, pricing, orders, or support context).
            </li>
            <li>Client data is never used to train third-party foundation models.</li>
            <li>
              Customer-facing quotations and sensitive messages require human approval before dispatch, and every agent
              action is logged for auditability.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
