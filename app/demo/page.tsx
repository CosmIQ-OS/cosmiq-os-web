import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo: WhatsApp enquiry to quotation",
  description: "A storyboard of the CosmIQ Enquiry & Quotation Agent: a customer chat, LIMS checks, and a quotation built from your fixed template.",
};

export default function Demo() {
  return (
    <>
      <section className="section page-head">
        <div className="wrap">
          <p className="kicker"><span>Demo</span>Prototype walkthrough</p>
          <h1>Watch an enquiry become a quotation.</h1>
          <p className="lede">A storyboard of the Enquiry &amp; Quotation Agent. A screen recording of the web-chat pilot will replace it once the pilot is live.</p>
          <span className="proto">Labelled prototype. Not a live customer integration; service names and figures are illustrative.</span>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap demo-grid">
          <div className="panel" aria-label="Demo conversation">
            <div className="panel-h"><span>● Customer chat</span><span>Steps 1–5</span></div>
            <div className="panel-b">
              <p className="bubble in"><small>Customer · 21:42</small>Hi, we need pesticide and aflatoxin testing for 3 black pepper samples.</p>
              <p className="bubble out"><small>CosmIQ agent</small>Please share your full name, phone number and GST number so we can check your customer record.</p>
              <p className="check">✓ Customer details checked against records · both services available</p>
              <p className="bubble out"><small>CosmIQ agent</small>Please confirm: pesticide and aflatoxin testing for 3 samples of Black Pepper. Is this correct?</p>
              <p className="bubble in"><small>Customer</small>Yes, that&apos;s correct.</p>
              <p className="bubble out"><small>CosmIQ agent</small>What email address should we send your quotation to?</p>
              <p className="bubble in"><small>Customer</small>customer@example.com</p>
              <p className="bubble out"><small>CosmIQ agent</small>Your quotation will be emailed to you after approval.</p>
            </div>
          </div>

          <div style={{ display: "grid", gap: 28 }}>
            <div className="panel" aria-label="Generated quotation">
              <div className="panel-h"><span>Staff preview · fixed template</span><span>Step 6</span></div>
              <div className="panel-b">
                <div className="quote">
                  <div className="quote-row"><span>Pesticide residue panel × 3</span><span>price: catalogue</span></div>
                  <div className="quote-row"><span>Aflatoxin panel × 3</span><span>price: catalogue</span></div>
                  <div className="quote-row"><span>Tax</span><span>backend</span></div>
                  <div className="quote-row total"><span>TOTAL</span><span>computed, not generated</span></div>
                </div>
                <p className="tiny">Every line item, price and turnaround time is read from the LIMS. The AI writes the conversation, not the numbers.</p>
              </div>
            </div>
            <div className="panel">
              <div className="panel-h"><span>Approval &amp; delivery</span><span>Staff controlled</span></div>
              <div className="panel-b">
                <p style={{ display: "flex", gap: 12, alignItems: "center" }}><span className="tag ok">Saved</span>Enquiry stored for tracking</p>
                <p style={{ display: "flex", gap: 12, alignItems: "center" }}><span className="tag hi">On approval</span>Quotation PDF submitted by email</p>
              </div>
            </div>
            <div><a className="btn" href="/contact">Request the live pilot demo →</a></div>
          </div>
        </div>
      </section>
    </>
  );
}
