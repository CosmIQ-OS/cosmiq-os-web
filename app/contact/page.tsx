import LeadForm from "@/components/LeadForm";

export default function Contact() {
  return (
    <section className="section light">
      <div className="wrap">
        <p className="kicker">Contact</p>
        <h2>Tell us what to automate.</h2>
        <p className="lede">What admin work takes too much of your time? Tell us, and we&apos;ll discuss a pilot.</p>
        <LeadForm />
      </div>
    </section>
  );
}
