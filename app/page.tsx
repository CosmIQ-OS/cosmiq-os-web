import Link from "next/link";
import LeadForm from "@/components/LeadForm";
import HeroArt from "@/components/tandem/HeroArt";
import Statement from "@/components/tandem/Statement";
import Odometer from "@/components/tandem/Odometer";

const FAQ = [
  ["Can the AI quote a wrong price?", "No. Prices, taxes and totals are calculated by backend business logic from your LIMS or service database. The AI only handles the conversation."],
  ["What if a customer asks for a test we don't offer?", "The agent only offers services it finds in your LIMS, so it won't invent one. The enquiry is still saved, so your team can follow up."],
  ["Does anything get sent without approval?", "Marketing messages never go out until an administrator approves each draft. Quotations are built from your fixed template using verified LIMS data."],
  ["Does our team have to change how it works?", "No. Staff keep working in your LIMS. Enquiries are saved and orders are created there where needed."],
  ["Which LIMS do you work with?", "We connect through your LIMS API and agree exactly which data (services, prices, customers, orders) the agents read and write. No API yet? The pilot can start from your service and price database."],
  ["What about customer data and privacy?", "Access is limited to what the pilot needs and follows your lab's privacy policy. Agent actions are logged for review."],
];

export default function Home() {
  return (
    <>
      <section className="hero" id="top">
        <div className="hero-main">
          <div>
            <h1 className="hero-title">
              <span className="intro" style={{ "--i": 0 } as any}>
                The <em className="claim">no guesswork</em>
              </span>
              <span className="intro" style={{ "--i": 1 } as any}>
                WhatsApp enquiry
              </span>
              <span className="intro" style={{ "--i": 2 } as any}>
                to quotation engine.
              </span>
            </h1>
            <p className="lede hero-sub intro" style={{ "--i": 3 } as any}>
              <b>Your LIMS stays the source of truth.</b> AI agents on top of your LIMS that answer customer enquiries,
              prepare accurate quotations, and draft follow-ups. Prices, taxes and TAT are computed by deterministic code,
              never by AI guesswork.
            </p>
            <div className="ctas intro" style={{ "--i": 4 } as any}>
              <Link className="btn solid" href="/contact">
                Request a pilot →
              </Link>
              <Link className="btn" href="/demo">
                See live demo
              </Link>
            </div>
            <Odometer target={1482} label="LIMS checks verified" />
            <div className="hero-trust intro" style={{ "--i": 6 } as any}>
              <div className="trust-pill">
                <span className="trust-dot" />
                <span>Zero change to staff LIMS routines</span>
              </div>
              <div className="trust-pill">
                <span className="trust-dot" />
                <span>Official Meta WhatsApp Cloud API integration</span>
              </div>
              <div className="trust-pill">
                <span className="trust-dot" />
                <span>ISO/IEC 17025 compliant quotation templates</span>
              </div>
            </div>
          </div>
          <div
            className="hero-art intro"
            style={{ "--i": 2 } as any}
            role="img"
            aria-label="ASCII drawing of customer WhatsApp chat connected directly to laboratory LIMS"
          >
            <HeroArt />
          </div>
        </div>

        <ul className="facts" aria-label="What you can rely on">
          <li>
            <b>Deterministic pricing</b>
            <span>Prices, taxes &amp; TAT computed strictly by backend logic from your LIMS.</span>
          </li>
          <li>
            <b>Staff in control</b>
            <span>Quotations and customer follow-ups are approved by staff before sending.</span>
          </li>
          <li>
            <b>Direct LIMS integration</b>
            <span>Connects to your service catalogue via API or secure database replica.</span>
          </li>
          <li>
            <b>Audit-ready logs</b>
            <span>Every enquiry, customer verification, and state transition is recorded.</span>
          </li>
        </ul>
      </section>

      <Statement
        lines={[
          ["Not a", "guess."],
          ["Verified", "pricing."],
          ["Your real", "LIMS."],
        ]}
        note="Your laboratory runs on precision. CosmIQ talks to customers in natural language, while all services, test parameters, turnaround times and prices are fetched strictly from your LIMS database."
      />

      <section className="ways" id="agents" aria-labelledby="waysTitle">
        <div className="wrap">
          <h2 className="h2" id="waysTitle" data-rv="head">
            Two agents on top of your LIMS
          </h2>
          <div className="ways-list">
            <div className="way" data-rv="row">
              <h3>Enquiry &amp; Quote Agent</h3>
              <p>
                Receives customer requests on WhatsApp, checks service availability in your LIMS, confirms sample
                counts and pre-fills quotations for staff review.
                <span className="speed">deterministic pricing · verified test catalogue</span>
              </p>
            </div>
            <div className="way" data-rv="row">
              <h3>Customer Follow-up Agent</h3>
              <p>
                Identifies previous test requests and seasonal testing cycles from LIMS records. Drafts personalised check-ins for repeat customers. An administrator reviews every draft before sending.
                <span className="speed">staff approved · human-in-the-loop</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="install" id="workflow" aria-labelledby="installTitle">
        <div className="wrap">
          <h2 className="h2" id="installTitle" data-rv="head">
            From first message
            <br />
            to a verified quote.
          </h2>
          <div className="workflow-intro" data-rv="row">
            <p className="workflow-intro-lead">
              From the instant a customer sends a message on WhatsApp to the moment your staff approves and dispatches an official quotation PDF, CosmIQ enforces a strict verification pipeline. Test availability, sample sizes, turnaround times, and contract pricing are queried directly from your LIMS.
            </p>
          </div>

          <ol className="install-steps" aria-label="Enquiry and quotation workflow">
            <li data-rv="row">
              <div>
                <h3>1. Request on WhatsApp</h3>
                <p>A customer asks for food or chemical testing in their own words, any time of day.</p>
              </div>
              <div className="typed" aria-label="Example WhatsApp enquiry log">
                <span className="p">[WHATSAPP IN]</span> &quot;Hi, need pesticide residue testing for 2 samples of basmati rice. How much?&quot;{"\n"}
                <span className="p">[LIMS CHECK]</span> Querying service catalogue: pesticide residue panel (rice){"\n"}
                <span className="p">[LIMS RESULT]</span> ✓ Service available · method on file · TAT 5 working days
              </div>
            </li>

            <li data-rv="row">
              <div>
                <h3>2. AI Analysis &amp; LIMS Match</h3>
                <p>
                  CosmIQ parses the customer&apos;s natural language enquiry, maps the sample matrix to certified standard methods in your LIMS, and verifies customer GSTIN for contract pricing.
                </p>
              </div>
              <div className="ai-analysis-card" aria-label="AI Analysis and LIMS Verification Card">
                <div className="ai-card-header">
                  <div className="ai-card-title">
                    <span className="ai-pulse-dot" />
                    <span>CosmIQ Entity &amp; LIMS Match</span>
                  </div>
                  <span className="ai-confidence-pill">99.4% Match</span>
                </div>
                <div className="ai-card-matrix">
                  <div className="ai-card-row">
                    <span className="ai-k">Sample Matrix</span>
                    <span className="ai-v bold">Basmati Rice (Export Grade)</span>
                  </div>
                  <div className="ai-card-row">
                    <span className="ai-k">Detected Test</span>
                    <span className="ai-v">Multi-Residue Pesticide Screen (250+ compounds)</span>
                  </div>
                  <div className="ai-card-row">
                    <span className="ai-k">Standard Method</span>
                    <span className="ai-v mono">AOAC 2007.01 · NABL Accredited</span>
                  </div>
                  <div className="ai-card-divider" />
                  <div className="ai-card-row">
                    <span className="ai-k">Customer Record</span>
                    <span className="ai-v bold">Apex Agro Exports Ltd</span>
                  </div>
                  <div className="ai-card-row">
                    <span className="ai-k">GSTIN / Tax ID</span>
                    <span className="ai-v mono">27AABCA1234F1Z9</span>
                  </div>
                  <div className="ai-card-row status-highlight">
                    <span className="ai-k">LIMS Rate Card</span>
                    <span className="ai-v verified-badge">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                        <path d="M13.5 4.5l-7 7L3 8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Verified · Tier-2 Contract Applied
                    </span>
                  </div>
                </div>
              </div>
            </li>

            <li data-rv="row">
              <div>
                <h3>3. Staff approves, quote emailed</h3>
                <p>
                  A fixed-template quotation uses calculated prices and tax. Staff review it before emailing.
                </p>
              </div>
              <div className="panel" style={{ background: "var(--black)" }}>
                <div className="panel-h">
                  <span>● Quote #Q-0142</span>
                  <span>Awaiting approval</span>
                </div>
                <div className="panel-b">
                  <div className="quote">
                    <div className="quote-row">
                      <span>Pesticide residue panel × 2</span>
                      <span>from LIMS</span>
                    </div>
                    <div className="quote-row">
                      <span>GST @ 18%</span>
                      <span>backend logic</span>
                    </div>
                    <div className="quote-row total">
                      <span>TOTAL AMOUNT</span>
                      <span>₹ 9,440.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="secure light" id="guardrails" aria-labelledby="secTitle" data-rv="ripple">
        <div className="wrap">
          <h2 className="h2" id="secTitle" data-rv="head">
            The AI never invents services, prices, test methods or turnaround times
          </h2>
          <div className="secure-grid">
            <div>
              <h3>LIMS is the sole source</h3>
              <p>Every test name, parameter, standard method, sample requirement and price is read directly from your LIMS.</p>
            </div>
            <div>
              <h3>Backend calculates</h3>
              <p>Prices, volume tiers, taxes and totals are computed by business logic code, never by the language model.</p>
            </div>
            <div>
              <h3>Human in the loop</h3>
              <p>No quotation or marketing message goes out until your laboratory staff inspect and approve the draft.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="desktops" aria-labelledby="deskTitle">
        <div className="wrap">
          <h2 className="h2" id="deskTitle" data-rv="head">
            Works where your lab works
          </h2>
          <table className="desk-table">
            <tbody>
              <tr data-rv style={{ "--i": 0 } as any}>
                <th>LIMS Integration</th>
                <td>Connects via REST API, GraphQL, LabWare, StarLIMS, or secure PostgreSQL/MySQL database replicas.</td>
              </tr>
              <tr data-rv style={{ "--i": 1 } as any}>
                <th>WhatsApp Business</th>
                <td>Official Meta WhatsApp Cloud API with verified business identity, automated routing, and end-to-end TLS encryption.</td>
              </tr>
              <tr data-rv style={{ "--i": 2 } as any}>
                <th>Quotation Engine</th>
                <td>Produces audit-ready, fixed-template PDF quotations matching your laboratory&apos;s ISO/IEC 17025 identity.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="install" id="faq" aria-labelledby="faqTitle">
        <div className="wrap">
          <h2 className="h2" id="faqTitle" data-rv="head">
            Frequently asked questions
          </h2>
          <div className="faq-grid">
            {FAQ.map(([q, a]) => (
              <details key={q} className="faq">
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="install" id="pilot" aria-labelledby="pilotTitle">
        <div className="wrap">
          <h2 className="h2" id="pilotTitle" data-rv="head">
            Request a pilot
          </h2>
          <p className="lede">
            Tell us about your laboratory. We&apos;ll reply with a pilot plan scoped to your LIMS, service catalogue and quotation format.
          </p>

          <div className="cta-grid">
            <div>
              <ol className="install-steps" style={{ marginTop: 0 }}>
                <li data-rv="row" style={{ padding: "20px 0" }}>
                  <div>
                    <h3>1. Scope</h3>
                    <p>We review your enquiry types, quotation templates, and LIMS access.</p>
                  </div>
                </li>
                <li data-rv="row" style={{ padding: "20px 0" }}>
                  <div>
                    <h3>2. Web-chat pilot</h3>
                    <p>Run the enquiry-to-quotation workflow in private web chat against real data.</p>
                  </div>
                </li>
                <li data-rv="row" style={{ padding: "20px 0" }}>
                  <div>
                    <h3>3. Live on WhatsApp</h3>
                    <p>Connect your verified WhatsApp Business line once your team is confident.</p>
                  </div>
                </li>
              </ol>
            </div>

            <LeadForm />
          </div>
        </div>
      </section>
    </>
  );
}
