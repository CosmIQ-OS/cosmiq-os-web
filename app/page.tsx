import LeadForm from "@/components/LeadForm";

const ENQUIRY_FLOW = [
  { h: "Request on WhatsApp", p: "A customer asks for a test in their own words, any time of day." },
  { h: "Service checked in LIMS", p: "Availability, parameters and methods are read from your LIMS, not guessed." },
  { h: "Missing details collected", p: "The agent asks only for what's missing: sample type, quantity, turnaround." },
  { h: "Quote from template", p: "Prices, tax and totals come from business logic, rendered on your fixed template.", key: true },
  { h: "Enquiry saved, order created", p: "Every enquiry is stored for tracking; orders are raised in LIMS where needed." },
];

const MARKETING_FLOW = [
  { h: "Read verified customers", p: "Customer and previous-order history from LIMS, on a daily or weekly schedule." },
  { h: "Suggest related services", p: "Matches past orders to relevant tests your lab actually offers." },
  { h: "Draft the message", p: "Personalised WhatsApp promotions, written for each customer." },
  { h: "Admin approves", p: "Nothing is sent until an administrator reviews and approves each draft.", key: true },
  { h: "Send and learn", p: "Approved messages go out; the agent learns from the edits your admin makes." },
];

const ROLES = [
  ["AI understands", "Interprets the customer's message, extracts information, writes natural follow-up questions and drafts."],
  ["Workflow controls", "A controlled state machine decides each step. The AI does not run the process on its own."],
  ["LIMS verifies", "Services, parameters, sample requirements, turnaround times and prices are always read from your LIMS."],
  ["Backend calculates", "Prices, tax and totals are computed by business logic, never by the AI."],
  ["Quotation engine generates", "Quotations are produced from a fixed template and stored for tracking."],
];

function Flow({ steps, label }: { steps: { h: string; p: string; key?: boolean }[]; label: string }) {
  return (
    <ol className="flow" aria-label={label}>
      {steps.map((s, i) => (
        <li key={s.h} className={`fnode${s.key ? " key" : ""}`}>
          <b>{String(i + 1).padStart(2, "0")} →</b>
          <h3>{s.h}</h3>
          <p>{s.p}</p>
        </li>
      ))}
    </ol>
  );
}

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="wrap hero-in">
          <div>
            <span className="tag acc dot">For food &amp; testing labs</span>
            <h1>WhatsApp enquiry to quotation. <span className="hl">No guesswork.</span></h1>
            <p className="sub">CosmIQ adds AI agents on top of your LIMS. They answer customer enquiries, build accurate quotations and draft follow-up marketing, while <b>your LIMS stays the source of truth</b> and <b>your staff approve what matters</b>.</p>
            <div className="hero-btns">
              <a href="/contact" className="btn">Book a pilot →</a>
              <a href="#workflow" className="btn ghost">See the workflow</a>
            </div>
            <p className="hero-note">Web-chat pilot first · WhatsApp next · deeper LIMS automation after</p>
          </div>

          <div className="panel" aria-label="Illustrative enquiry to quotation">
            <div className="panel-h"><span>● WhatsApp enquiry</span><span>Illustrative</span></div>
            <div className="panel-b">
              <p className="bubble in"><small>Customer</small>Need pesticide residue testing for 2 samples of basmati rice. How much?</p>
              <p className="check">✓ LIMS: service available · method on file · TAT 5 working days</p>
              <p className="bubble out"><small>CosmIQ agent</small>Sure. Is this for export or domestic compliance? And roughly how much sample can you send?</p>
              <p className="bubble in"><small>Customer</small>Export. 500 g each.</p>
              <div className="quote" aria-label="Quotation summary">
                <div className="quote-row"><span>Pesticide residue panel × 2</span><span>from LIMS</span></div>
                <div className="quote-row"><span>Tax</span><span>by backend</span></div>
                <div className="quote-row total"><span>QUOTE #Q-0142</span><span>SENT ✓</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <p className="kicker"><span>01</span>The problem</p>
          <h2>Your lab runs on WhatsApp. Your LIMS doesn&apos;t.</h2>
          <p className="lede">Front-desk teams spend hours retyping enquiries, looking up price lists and chasing missing sample details, and past customers rarely hear from you again.</p>
          <div className="grid3">
            <div className="card"><span className="num">A /</span><h3>Enquiries get lost</h3><p>Requests arrive at all hours across personal and shared WhatsApp numbers, with no record of what was asked or answered.</p></div>
            <div className="card"><span className="num">B /</span><h3>Quoting is manual</h3><p>Staff check services, methods, TAT and prices by hand. Every quote is slow, and mistakes cost money.</p></div>
            <div className="card"><span className="num">C /</span><h3>Customers go quiet</h3><p>Order history sits in the LIMS, but nobody has time to suggest the next relevant test.</p></div>
          </div>
        </div>
      </section>

      <section id="agents" className="section">
        <div className="wrap">
          <p className="kicker"><span>02</span>Two agents</p>
          <h2>One layer on top of your LIMS.</h2>
          <p className="lede">Both agents read from your LIMS and work through WhatsApp. Your laboratory staff stay in control.</p>
          <div className="grid2">
            <article className="card agent b">
              <div className="agent-h"><div><span className="tag">Agent 01</span><h3>Enquiry &amp; Quotation Agent</h3></div></div>
              <ul>
                <li>Receives customer requests on WhatsApp</li>
                <li>Checks service availability in your LIMS</li>
                <li>Collects only the missing details</li>
                <li>Generates a quotation from your fixed template</li>
                <li>Saves the enquiry and creates an order where needed</li>
              </ul>
            </article>
            <article className="card agent a">
              <div className="agent-h"><div><span className="tag">Agent 02</span><h3>Marketing Agent</h3></div><span className="tag ok">Admin approved</span></div>
              <ul>
                <li>Reads verified customers and their previous orders</li>
                <li>Suggests related services you actually offer</li>
                <li>Drafts personalised WhatsApp promotions</li>
                <li>An administrator reviews every draft before sending</li>
                <li>Learns from the edits your administrator makes</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section id="workflow" className="section alt">
        <div className="wrap">
          <p className="kicker"><span>03</span>Enquiry → quotation</p>
          <h2>From first message to a correct quote.</h2>
          <p className="lede">When a customer writes in, the agent follows a controlled sequence. Service availability, requirements and prices are always fetched from your LIMS.</p>
          <Flow steps={ENQUIRY_FLOW} label="Enquiry and quotation workflow" />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="kicker"><span>04</span>Marketing</p>
          <h2>Re-engage customers, with a human in the loop.</h2>
          <p className="lede">Runs on a schedule your administrator configures. Nothing reaches a customer without approval.</p>
          <Flow steps={MARKETING_FLOW} label="Marketing agent workflow" />
        </div>
      </section>

      <section id="guardrails" className="section ink">
        <div className="wrap">
          <p className="kicker"><span>05</span>Guardrails</p>
          <div className="rule-band"><p>The AI never invents services, prices, test methods, sample requirements or turnaround times.</p></div>
          <h2>Who does what.</h2>
          <p className="lede">The language model handles language. Everything that has to be correct is handled by your data and deterministic code.</p>
          <div style={{ overflowX: "auto" }}>
            <table className="t">
              <thead><tr><th>Role</th><th>Responsibility</th></tr></thead>
              <tbody>{ROLES.map(([r, d]) => <tr key={r}><td>{r}</td><td>{d}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="pilot" className="section alt">
        <div className="wrap">
          <p className="kicker"><span>06</span>Pilot</p>
          <h2>Start lean. Prove it. Then scale.</h2>
          <p className="lede">We prove the full enquiry → information collection → quotation loop before touching live customer channels.</p>
          <div className="steps">
            <div className="step"><b>1</b><h3>Web-chat pilot</h3><p>Run the complete enquiry-to-quotation workflow in a web chat, against your real service data.</p></div>
            <div className="step"><b>2</b><h3>Connect WhatsApp</h3><p>Move the proven workflow onto your WhatsApp Business number.</p></div>
            <div className="step"><b>3</b><h3>Deeper LIMS automation</h3><p>Order creation, marketing schedules and more workflows, once you&apos;re confident.</p></div>
          </div>
          <div className="needs">
            <strong>What we need from you:</strong>
            <span>Permission to run a pilot</span>
            <span>LIMS API access</span>
            <span>Your privacy policy</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="kicker"><span>07</span>Stack</p>
          <h2>Deliberately lean.</h2>
          <p className="lede">A minimal, proven stack so the pilot ships quickly and scales later.</p>
          <div className="pills">
            <span>Next.js</span><span>FastAPI</span><span>PostgreSQL</span><span>OpenAI / Gemini</span><span>Vercel</span><span>Railway</span><span>LIMS API</span>
          </div>
        </div>
      </section>

      <section id="contact" className="section alt">
        <div className="wrap cta-grid">
          <div className="aside">
            <p className="kicker"><span>08</span>Book a pilot</p>
            <h2>Put your front desk on autopilot.</h2>
            <p className="lede" style={{ marginBottom: 8 }}>Tell us about your lab. We&apos;ll reply with a pilot plan scoped to your LIMS and services.</p>
            <ol>
              <li>We review your enquiry and current quoting process.</li>
              <li>A short call to scope one workflow and your LIMS access.</li>
              <li>Web-chat pilot on your real service data.</li>
            </ol>
          </div>
          <div>
            <LeadForm />
            <div className="faqs">
              <h3>Questions</h3>
              <details className="faq"><summary>Can the AI quote a wrong price?</summary><p>No. Prices, tax and totals are calculated by backend business logic from your LIMS or service database. The AI only handles the conversation.</p></details>
              <details className="faq"><summary>Does anything get sent without approval?</summary><p>Marketing messages are never sent without an administrator approving each draft. Quotations are built from your fixed template using verified data.</p></details>
              <details className="faq"><summary>Which LIMS do you work with?</summary><p>We integrate through your LIMS API. During the pilot we scope exactly which data (services, prices, customers, orders) we read and write.</p></details>
              <details className="faq"><summary>What about customer data and privacy?</summary><p>Access is limited to what the pilot needs and follows your lab&apos;s privacy policy. Agent actions are logged for review.</p></details>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
