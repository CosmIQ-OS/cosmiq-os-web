export default function NotFound() {
  return (
    <section className="section">
      <div className="wrap nf">
        <p className="big" aria-hidden="true">404</p>
        <h1>This page isn&apos;t on file.</h1>
        <p className="lede">The link may be old or mistyped. Here&apos;s where most labs want to go:</p>
        <div className="hero-btns">
          <a className="btn" href="/">Back to home →</a>
          <a className="btn ghost" href="/contact">Request a pilot</a>
        </div>
      </div>
    </section>
  );
}
