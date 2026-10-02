// Vercel sets this to the production domain; fall back to the known alias elsewhere.
export const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://cosmiq-os.vercel.app";

export const SITE_NAME = "CosmIQ";

export const SITE_DESCRIPTION =
  "AI agents on top of your LIMS: WhatsApp enquiries turned into accurate quotations, and customer follow-ups your team approves. Prices and services always come from your LIMS.";

export const NAV = [
  { href: "/#agents", label: "Agents" },
  { href: "/#workflow", label: "How it works" },
  { href: "/demo", label: "Demo" },
  { href: "/#pilot", label: "Pilot" },
  { href: "/#faq", label: "FAQ" },
];
