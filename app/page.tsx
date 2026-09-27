import LeadForm from "@/components/LeadForm";

export default function Home() {
  return (
    <>
      <section className="hero wrap">
        <div className="pill">For growing service teams</div>
        <h1>Stop chasing routine work.<br /><span className="grad">Close the loop.</span></h1>
        <p className="sub">Cosmiq OS uses your business documents to find answers, coordinate tasks, and follow up until work is done.</p>
        <div className="hero-btns">
          <a href="/contact" className="btn">Request a pilot demo →</a>
          <a href="/demo" className="btn ghost">See how it works</a>
        </div>
      </section>

      <section id="how" className="section light">
        <div className="wrap">
          <p className="kicker">Workflow</p>
          <h2>One task, handled end to end.</h2>
          <p className="lede">A request arrives → the right instruction is found → work is assigned → follow-up happens → completion is recorded.</p>
          <div className="flow" aria-label="Example workflow">
            <div className="fnode"><b>📥</b>Request arrives</div>
            <div className="fnode"><b>📄</b>SOP found</div>
            <div className="fnode"><b>👤</b>Teammate assigned</div>
            <div className="fnode"><b>📞</b>Follow-up + call if needed</div>
            <div className="fnode"><b>✔</b>Done + recorded</div>
          </div>
          <span className="proto">Illustrated prototype walkthrough — live integrations per pilot scope.</span>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="kicker">Problem</p>
          <h2>Admin lives in chats.</h2>
          <div className="grid3">
            <div className="card"><div className="ico">◈</div><h3>Scattered info</h3><p>Policies in Drive. Tasks in chat. Updates in someone&apos;s head.</p></div>
            <div className="card"><div className="ico">⬢</div><h3>Chasing updates</h3><p>Managers spend the day asking who did what.</p></div>
            <div className="card"><div className="ico">✦</div><h3>Nothing recorded</h3><p>Done work leaves no trace to learn from.</p></div>
          </div>
        </div>
      </section>

      <section className="section light">
        <div className="wrap">
          <p className="kicker">What Cosmiq does</p>
          <h2>Find. Coordinate. Close.</h2>
          <div className="grid3">
            <div className="card"><div className="ico">🔎</div><h3>Find the answer</h3><p>Ground answers in your documents, with sources shown.</p></div>
            <div className="card"><div className="ico">🗂</div><h3>Coordinate the work</h3><p>Assign, track and follow up across teams.</p></div>
            <div className="card"><div className="ico">✔</div><h3>Close the loop</h3><p>Record confirmations — and pilot approved follow-up calls.</p></div>
          </div>
        </div>
      </section>

      <section id="pilot" className="section">
        <div className="wrap">
          <p className="kicker">Pilot</p>
          <h2>Start with one workflow.</h2>
          <div className="steps">
            <div className="step"><b>1</b><h3>Pick one task</h3><p>A repeatable job that currently needs chasing.</p></div>
            <div className="step"><b>2</b><h3>Connect its info</h3><p>Relevant docs and tools only — nothing more.</p></div>
            <div className="step"><b>3</b><h3>Review results</h3><p>See outcomes with your team before expanding.</p></div>
          </div>
        </div>
      </section>

      <section className="section light">
        <div className="wrap">
          <p className="kicker">Where it grows</p>
          <h2>One foundation, then expand.</h2>
          <p className="lede">Initial pilot focus, then expand where customers ask for it.</p>
          <div className="pills">
            <span>◎ Documentation (pilot)</span>
            <span>◎ Team coordination (pilot)</span>
            <span>◎ CRM updates (pilot)</span>
            <span><span className="planned">○</span> Customer support (planned)</span>
            <span><span className="planned">○</span> Meetings + notes (planned)</span>
            <span><span className="planned">○</span> Accounting links (planned)</span>
            <span><span className="planned">○</span> Voice follow-ups (pilot-gated)</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="kicker">Control</p>
          <h2>You stay in charge.</h2>
          <p className="lede">A pilot starts with agreed documents and tools. We design calls and consequential actions for human approval.</p>
          <div className="hero-btns" style={{ justifyContent: "flex-start" }}>
            <a href="/contact" className="btn">Request a pilot →</a>
          </div>
          <div id="contact-mini" style={{ marginTop: 18 }}><LeadForm /></div>
          <div style={{ marginTop: 22 }}>
            <details className="faq"><summary>What can we connect first?</summary><p>The documents and tools behind one repeatable workflow — for example tasks plus your CRM.</p></details>
            <details className="faq"><summary>How does a pilot start?</summary><p>You describe the task, we scope the workflow, then review results with your team.</p></details>
            <details className="faq"><summary>Can a human approve calls and actions?</summary><p>Yes. We scope calls and external actions around your team&apos;s approval process.</p></details>
          </div>
        </div>
      </section>
    </>
  );
}
