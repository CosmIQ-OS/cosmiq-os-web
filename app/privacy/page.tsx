import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How CosmIQ handles pilot enquiries and lab data.",
};

export default function Privacy() {
  return (
    <section className="section">
      <div className="wrap">
        <p className="kicker"><span>Privacy</span>How we handle data</p>
        <h1>Privacy note.</h1>
        <div className="prose">
          <h3>Pilot enquiries on this website</h3>
          <p>We collect your contact details and the areas you want automated so we can respond to your pilot request. Enquiries are stored in a database available only to authorised staff, not on the public website.</p>
          <h3>Lab pilots</h3>
          <ul>
            <li>Each lab&apos;s data is isolated to that lab.</li>
            <li>We access only the LIMS data the agreed pilot needs, such as services, prices, customers and orders.</li>
            <li>Customer conversations are handled under the lab&apos;s own privacy policy.</li>
            <li>Marketing messages are never sent without administrator approval. Agent actions are logged.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
