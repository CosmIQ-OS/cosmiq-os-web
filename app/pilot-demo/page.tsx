import type { Metadata } from "next";
import { cookies } from "next/headers";
import DemoApp from "@/components/demo/DemoApp";
import DemoGate from "@/components/demo/DemoGate";
import { DEMO_COOKIE, demoConfigured, hasDemoAccess } from "@/lib/demo/access";

export const metadata: Metadata = {
  title: "Agentic enquiry desk · prototype",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function PilotDemo() {
  if (!demoConfigured()) {
    return (
      <section className="section">
        <div className="wrap">
          <h1>Demo not configured.</h1>
          <p className="lede">Set DEMO_ACCESS_CODE and STAFF_SESSION_SECRET to enable the prototype.</p>
        </div>
      </section>
    );
  }
  const allowed = hasDemoAccess((await cookies()).get(DEMO_COOKIE)?.value);
  return allowed ? <DemoApp /> : <DemoGate />;
}
