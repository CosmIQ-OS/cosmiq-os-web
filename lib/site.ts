// Vercel sets this to the production domain; fall back to the known alias elsewhere.
export const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://cosmiq-os.vercel.app";

export const SITE_NAME = "CosmIQ OS";

export const SITE_DESCRIPTION =
  "We help businesses understand where AI belongs and where human effort belongs — then build secure, deterministic AI agents on top of the tools you already use.";

export const NAV = [
  { href: "/#vision", label: "Vision" },
  { href: "/services", label: "Services" },
  { href: "/demo", label: "Demo" },
];
