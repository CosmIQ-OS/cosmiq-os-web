export interface ServiceItem {
  code: string;
  title: string;
  summary: string;
  guardrail: string;
}

export interface SecurityPillar {
  title: string;
  description: string;
}

export const VISION_BOUNDARY = {
  ai: {
    label: "Where AI belongs",
    tag: "Cut the noise",
    items: [
      "Instant replies to routine enquiries on WhatsApp, web & email",
      "Looking up records across your CRM, ERP, LIMS, or databases",
      "Preparing draft documents, quotes, summaries, and reminders",
      "Routing tasks and syncing routine updates across departments",
    ],
  },
  human: {
    label: "Where human effort belongs",
    tag: "Craft the core",
    items: [
      "Building customer relationships and earning long-term trust",
      "Reviewing and approving quotations or sensitive messages",
      "Handling complex exceptions and nuanced judgment calls",
      "Leading strategy, craft quality, and business growth",
    ],
  },
} as const;

export const SECURITY_PILLARS: SecurityPillar[] = [
  {
    title: "Deterministic logic for numbers",
    description:
      "AI reads natural language; verified backend code calculates every price, tax, and business rule. Zero guessing.",
  },
  {
    title: "Human-in-the-loop by default",
    description:
      "Automation prepares the work; a named team member approves what leaves the building. Nothing fires silently.",
  },
  {
    title: "Security built into every layer",
    description:
      "Least-privilege access to your existing systems, encrypted transport, audit-ready logs, and zero model training on your data.",
  },
];

export const SERVICES: ServiceItem[] = [
  {
    code: "01",
    title: "AI Workflow & Operations Automation",
    summary:
      "Automate repetitive internal processes — from data entry and document preparation to approvals, task routing, record updates, and follow-ups — without disrupting how your team works.",
    guardrail: "Every action logged & reversible",
  },
  {
    code: "02",
    title: "Customer Support Automation",
    summary:
      "Deploy AI agents across WhatsApp, web chat, and email that answer routine questions, collect required details, retrieve status updates, and escalate complex requests with full context.",
    guardrail: "Grounded strictly in your live records",
  },
  {
    code: "03",
    title: "Custom AI Agents for Business Operations",
    summary:
      "Build purpose-specific AI agents for customer service, sales support, coordination, and back-office work that operate strictly inside your defined business rules and approval steps.",
    guardrail: "Role-based permissions & explicit rules",
  },
  {
    code: "04",
    title: "Business Systems Integration",
    summary:
      "Connect your CRM, ERP, LIMS, helpdesk, and databases through secure APIs and webhooks to eliminate duplicate data entry and create reliable handoffs between departments.",
    guardrail: "Your existing system stays the source of truth",
  },
  {
    code: "05",
    title: "Quotation, Document & Back-Office Automation",
    summary:
      "Automate quotations, order summaries, and operational reports using your approved templates. Calculations run in deterministic backend code and route for staff review before sending.",
    guardrail: "Backend code calculates · Staff approve before dispatch",
  },
  {
    code: "06",
    title: "Automation Consulting, Pilots & Optimisation",
    summary:
      "Map current workflows, separate what requires human judgment from what AI can safely automate, and prove value with a focused pilot against real scenarios before expanding.",
    guardrail: "Pilot first · Written success criteria",
  },
];

export const DELIVERY_STEPS = [
  {
    step: "01",
    title: "Map the boundary",
    description:
      "We review your daily workflow and separate what needs human judgment from what AI can handle safely.",
  },
  {
    step: "02",
    title: "Run a private pilot",
    description:
      "We test one focused workflow against your real data while your team reviews and verifies every output.",
  },
  {
    step: "03",
    title: "Launch with security",
    description:
      "Go live on your channels with approval controls, least-privilege access, audit logs, and ongoing monitoring.",
  },
] as const;
