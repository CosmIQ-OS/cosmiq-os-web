import LeadForm from "@/components/LeadForm";
import { TandemAsciiWordmark, TandemOdometer, TandemTerminalTabs } from "@/components/TandemInteractive";

const ENQUIRY_FLOW = [
  { h: "Request on WhatsApp", p: "A customer asks for a test in their own words, any time of day." },
  { h: "Customer verified", p: "Name, phone number and GST number are checked against customer records." },
  { h: "Services checked", p: "Availability comes from the service catalogue, never from AI guesswork." },
  { h: "Services & samples confirmed", p: "The customer confirms the selected services, sample type and sample count." },
  { h: "Email collected", p: "The agent asks where the approved quotation should be sent." },
  { h: "Staff approves, quote emailed", p: "A fixed-template quotation uses calculated prices and tax. Staff review it before emailing.", key: true },
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

const FAQ = [
  ["Can the AI quote a wrong price?", "No. Prices, tax and totals are calculated by backend business logic from your LIMS or service database. The AI only handles the conversation."],
  ["What if a customer asks for a test we don't offer?", "The agent only offers services it finds in your LIMS, so it won't invent one. The enquiry is still saved, so your team can follow up."],
  ["Does anything get sent without approval?", "Marketing messages never go out until an administrator approves each draft. Quotations are built from your fixed template using verified LIMS data."],
  ["Does our team have to change how it works?", "No. Staff keep working in your LIMS. Enquiries are saved and orders are created there where needed."],
  ["Which LIMS do you work with?", "We connect through your LIMS API and agree exactly which data (services, prices, customers, orders) the agents read and write. No API yet? Tell us; the pilot can start from your service and price database."],
  ["What about customer data and privacy?", "Access is limited to what the pilot needs and follows your lab's privacy policy. Agent actions are logged for review."],
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
        <div className="wrap hero-stack">
          <TandemAsciiWordmark word="COSMIQ" variant="hero" />

          <div className="hero-in">
            <div>
              <div className="hero-meta-row">
                <span className="tag acc dot">For food &amp; testing labs</span>
                <TandemOdometer target={1482} label="LIMS checks verified" />
              </div>
              <h1>WhatsApp enquiry to quotation. <span className="hl">No guesswork.</span></h1>
              <p className="sub">AI agents on top of your LIMS that answer customer enquiries, prepare accurate quotations and draft follow-ups. <b>Your LIMS stays the source of truth. Your staff approve what matters.</b></p>
              <div className="hero-btns">
                <a href="/contact" className="btn">Request a pilot →</a>
                <a href="#workflow" className="btn ghost">See how it works</a>
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
                  <div className="quote-row total"><span>QUOTE #Q-0142</span><span>AWAITING APPROVAL</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ul className="trust" aria-label="What you can rely on">
        <li><b>₹</b>Prices &amp; services from your LIMS</li>
        <li><b>✓</b>Every enquiry saved</li>
        <li><b>⚑</b>Admin approves every promotion</li>
        <li><b>◷</b>Replies any time of day</li>
      </ul>

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
                <li>Confirms services and sample counts, then collects email</li>
                <li>Prepares a quotation for staff approval and email delivery</li>
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
          <table className="t stack">
            <thead><tr><th>Role</th><th>Responsibility</th></tr></thead>
            <tbody>{ROLES.map(([r, d]) => <tr key={r}><td>{r}</td><td>{d}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section id="connect" className="section alt">
        <div className="wrap">
          <p className="kicker"><span>06</span>How it connects</p>
          <h2>Your customers, your LIMS, one layer between.</h2>
          <p className="lede">Nothing to replace. CosmIQ talks to customers on WhatsApp and to your LIMS through its API. Your team approves what goes out.</p>
          <div className="connect">
            <div className="node">
              <span className="tag">Your customers</span>
              <h3>WhatsApp</h3>
              <ul><li>Ask in their own words</li><li>Answer follow-up questions</li><li>Receive quotations</li></ul>
            </div>
            <div className="link" aria-hidden="true"><span>⇄</span>messages</div>
            <div className="node core">
              <span className="tag">CosmIQ</span>
              <h3>Agents</h3>
              <ul><li>Understand each message</li><li>Ask only for missing details</li><li>Draft replies &amp; promotions</li></ul>
            </div>
            <div className="link" aria-hidden="true"><span>⇄</span>LIMS API</div>
            <div className="node">
              <span className="tag">Source of truth</span>
              <h3>Your LIMS</h3>
              <ul><li>Services &amp; parameters</li><li>Prices &amp; turnaround times</li><li>Customers &amp; orders</li></ul>
            </div>
          </div>
          <div className="team-band"><strong>Your team</strong><span>approves every promotion</span><span>sees every enquiry</span><span>keeps working in your LIMS</span></div>
          <p className="stack-line">Under the hood: Next.js · FastAPI · PostgreSQL · OpenAI / Gemini · Vercel · Railway</p>
        </div>
      </section>

      <section id="pilot" className="section">
        <div className="wrap">
          <p className="kicker"><span>07</span>Pilot</p>
          <h2>Start lean. Prove it. Then scale.</h2>
          <p className="lede">We prove the full enquiry → information collection → quotation loop before touching live customer channels.</p>
          <TandemTerminalTabs />
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

      <section id="faq" className="section alt">
        <div className="wrap">
          <p className="kicker"><span>08</span>FAQ</p>
          <h2>Questions labs ask us.</h2>
          <div className="faq-grid">
            {FAQ.map(([q, a]) => (
              <details key={q} className="faq"><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="section">
        <div className="wrap cta-grid">
          <div className="aside">
            <p className="kicker"><span>09</span>Request a pilot</p>
            <h2>Put your front desk on autopilot.</h2>
            <p className="lede" style={{ marginBottom: 8 }}>Tell us about your lab. We&apos;ll reply with a pilot plan scoped to your LIMS and services.</p>
            <ol>
              <li>We review your enquiry and current quoting process.</li>
              <li>A short call to scope one workflow and your LIMS access.</li>
              <li>Web-chat pilot on your real service data.</li>
            </ol>
          </div>
          <LeadForm />
        </div>
      </section>
    </>
  );
}
