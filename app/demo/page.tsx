export default function Demo() {
  return (
    <section className="section light">
      <div className="wrap">
        <p className="kicker">Demo</p>
        <h2>Watch one task close itself.</h2>
        <p className="lede">Prototype walkthrough. A 30–45 second screen recording will replace this storyboard once the pilot workflow is live.</p>
        <div className="flow" aria-label="Demo storyboard">
          <div className="fnode"><b>1</b>Customer asks for an update</div>
          <div className="fnode"><b>2</b>Agent finds the SOP + past answer</div>
          <div className="fnode"><b>3</b>Task assigned in team inbox</div>
          <div className="fnode"><b>4</b>Approved call confirms progress</div>
          <div className="fnode"><b>5</b>Outcome logged to CRM</div>
        </div>
        <span className="proto">Labelled prototype — not a live customer integration.</span>
        <div style={{ marginTop: 24 }}><a className="btn" href="/contact">Request the live pilot demo →</a></div>
      </div>
    </section>
  );
}
