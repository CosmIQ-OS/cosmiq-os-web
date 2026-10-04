# WhatsApp enquiry → quotation demo — Requirements
Source: discovery session, 2026-10-03 / Status: COMPLETE

Client demo (FQLab) on 2026-10-04. Sample data: Food_Lab_Test_Database.xlsx (20 customers, 5 tests, 52 orders).

## Channel & AI
- R1: Customer chats in a WhatsApp-style web chat (simulated; no WhatsApp branding). The agent logic does not depend on the channel.
- R2: An AI (Google Gemini) reads free-text messages into structured fields. A fixed workflow and the database decide every step. Prices, tax, totals and turnaround come from code and data, never from the AI.
- R3: If the AI is unavailable, slow or fails, a built-in keyword parser handles the message. The lab view shows which engine handled each message.

## Data
- R4: Neon Postgres stores the demo data and the website's enquiry form.
- R4.1: Sample data is seeded from the spreadsheet; seeded rows are never changed by the demo.
- R11: Sample requirements per test are placeholders, labelled "illustrative" wherever shown.

## Conversation
- R5: Presenter picks one of the 20 sample customers or "New customer" before chatting. Known customers are greeted by name and the agent knows their company, GST No. and past tests. New customers are asked for name and company.
- R5.1: The agent collects test(s), sample type and number of samples, asking only for what is missing.
- R6: When details are complete, the customer receives a quotation card in the chat that opens a PDF: quote number, customer and GST No., per-test lines, 18% GST, total, turnaround, certificate, sample required, marked "Prototype · sample data".
- R7: When the customer confirms, a new order is created (next order ID, status "Awaiting sample") and the agent sends dispatch instructions.
- R9: Unknown tests or sample types, discount requests and faster-turnaround requests get a polite decline; the conversation is flagged "Needs staff". Nothing is invented.

## Lab view
- R8: Split screen: customer phone on the left, live lab panel on the right (customer card, agent trace, quotation and order status, Needs-staff flag).
- R12: "Reset demo" removes conversations, quotations and demo-created orders, keeping the seeded data.

## Access
- R10: Unlisted page behind a demo access code; not indexed by search engines; branded for the client.

## Defaults (not asked)
- English only.
- Marketing Agent (Workflow A) out of scope.

## Open Questions
- [OPEN] Real sample quantities per test (placeholders used until the lab provides them).
- [OPEN] Real WhatsApp (Meta Cloud API) connection — after the demo.

## Next Step
→ implementation (plan: ~/.claude/plans/starry-bubbling-thunder.md)
