import LeadForm from "@/components/LeadForm";

export default function Contact() {
  return (
    <section className="section">
      <div className="wrap cta-grid">
        <div className="aside">
          <p className="kicker"><span>Contact</span>Book a pilot</p>
          <h2>Tell us about your lab.</h2>
          <p className="lede" style={{ marginBottom: 8 }}>Where does your team lose the most time: enquiries, quotations or follow-ups? We&apos;ll reply with a pilot plan.</p>
          <ol>
            <li>We review your enquiry and current quoting process.</li>
            <li>A short call to scope one workflow and your LIMS access.</li>
            <li>Web-chat pilot on your real service data.</li>
          </ol>
        </div>
        <LeadForm />
      </div>
    </section>
  );
}
