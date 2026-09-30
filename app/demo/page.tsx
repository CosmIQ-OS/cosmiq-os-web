export default function Demo() {
  return (
    <>
      <section className="section page-head">
        <div className="wrap">
          <p className="kicker"><span>Demo</span>Prototype walkthrough</p>
          <h2>Watch an enquiry become a quotation.</h2>
          <p className="lede">A storyboard of the Enquiry &amp; Quotation Agent. A screen recording of the web-chat pilot will replace it once the pilot is live.</p>
          <span className="proto">Labelled prototype. Not a live customer integration; service names and figures are illustrative.</span>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap demo-grid">
          <div className="panel" aria-label="Demo conversation">
            <div className="panel-h"><span>● Customer chat</span><span>Step 1–3</span></div>
            <div className="panel-b">
              <p className="bubble in"><small>Customer · 21:42</small>Hi, we need a shelf-life study and microbial testing for a new packaged snack.</p>
              <p className="check">✓ LIMS: shelf-life study available · microbial panel available</p>
              <p className="bubble out"><small>CosmIQ agent</small>We can do both. To prepare a quotation: what storage conditions should the study cover, and how many samples will you send?</p>
              <p className="bubble in"><small>Customer</small>Ambient only. 3 samples.</p>
              <p className="check">✓ LIMS: sample requirement 250 g per sample · TAT from service record</p>
              <p className="bubble out"><small>CosmIQ agent</small>Thanks. Your quotation is ready below. Please send 250 g per sample. Reply YES to confirm and we&apos;ll create the order.</p>
            </div>
          </div>

          <div style={{ display: "grid", gap: 28 }}>
            <div className="panel" aria-label="Generated quotation">
              <div className="panel-h"><span>Quotation · fixed template</span><span>Step 4</span></div>
              <div className="panel-b">
                <div className="quote">
                  <div className="quote-row"><span>Shelf-life study (ambient) × 3</span><span>price: LIMS</span></div>
                  <div className="quote-row"><span>Microbial panel × 3</span><span>price: LIMS</span></div>
                  <div className="quote-row"><span>Tax</span><span>backend</span></div>
                  <div className="quote-row total"><span>TOTAL</span><span>computed, not generated</span></div>
                </div>
                <p className="tiny">Every line item, price and turnaround time is read from the LIMS. The AI writes the conversation, not the numbers.</p>
              </div>
            </div>
            <div className="panel">
              <div className="panel-h"><span>Records</span><span>Step 5</span></div>
              <div className="panel-b">
                <p style={{ display: "flex", gap: 12, alignItems: "center" }}><span className="tag ok">Saved</span>Enquiry stored for tracking</p>
                <p style={{ display: "flex", gap: 12, alignItems: "center" }}><span className="tag hi">On confirm</span>Order created in LIMS</p>
              </div>
            </div>
            <div><a className="btn" href="/contact">Request the live pilot demo →</a></div>
          </div>
        </div>
      </section>
    </>
  );
}
