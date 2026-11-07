# WhatsApp confirmation-only workflow

## Goal
Keep only the WhatsApp/web customer journey:
service request -> customer verification -> service/sample detail collection -> explicit confirmation.
Remove email collection, quotation creation, PDF generation, staff quotation approval, and email delivery.

## Scope
IN SCOPE:
- `lib/demo/types.ts`, `workflow.ts`, `agent.ts`, `data.ts`, `pricing.ts`
- `components/demo/PhoneChat.tsx`, `LabPanel.tsx`, `DemoApp.tsx`
- `app/api/demo/reset/route.ts`
- `app/demo/page.tsx` storyboard
- WhatsApp webhook restart condition
- Remove quotation/email/PDF/staff-approval routes, libraries, tests, dependency, env docs
- README, DESIGN.md, `.env.example`, Playwright config

OUT OF SCOPE:
- Public marketing homepage and site metadata (user chose demo + storyboard only)
- Website lead form and `/staff/enquiries`
- Staff authentication for website enquiries/reset
- Customer verification rules (name, phone, GST) and GST retry logic
- Real WhatsApp Cloud API setup already completed

MUST NOT CHANGE:
- HMAC verification, dedupe/retry, and WhatsApp send boundary
- Demo access cookie / staff session security
- Seed customer, test catalogue, and order history data
- Existing verification behavior: name + phone + GST, two-attempt mismatch retry, new-customer flag

## Data model
`ConvState = "requesting" | "identify" | "collecting" | "confirming" | "confirmed"`

`Draft` removes `email`, `quotationId`, `orderIds`.
`Extraction` removes `email`.
`Awaiting` removes `email`.
`TraceKind` removes `quote` and `order`.
`MessageMeta` removes `quote` and `order`.

`ConversationView` returns only conversation, profile, messages, events.
No quotation or order queries.

## Orchestration
1. `requesting`: collect catalogue test IDs. If none, ask again.
2. `identify`: collect missing name / phone / GST. Verify against records.
   - verified: welcome back
   - new: note details for the team, continue
   - retry: clear mismatched fields and ask again
   - unverified after retry: note for team, continue
3. `collecting`: collect missing sample type and sample count. Re-ask until complete.
4. `confirming`: show summary. `Confirm` -> `confirmed`. `Not yet` -> ask what to change.
5. `confirmed`: terminal. Reply that the request is recorded; `NEW`/`START` opens a fresh WhatsApp chat.
No email prompt. No quotation. No staff approval. No order creation.

## API / UI contracts
- `POST /api/demo/conversations/[id]/messages` unchanged.
- `GET /api/demo/conversations/[id]` returns no `quotations` / `orders`.
- `POST /api/demo/reset` still requires demo access + staff session, but no longer checks email sends.
- Remove:
  - `app/api/demo/quotations/**`
  - `app/api/staff/quotations/**`
  - `app/staff/quotations/**`
  - `lib/quotations/**`
  - `lib/demo/pdf.ts`
  - `tests/mock-email-server.mjs`
  - `tests/e2e/approval-logic.spec.ts`
- Remove `pdf-lib` dependency and Resend env keys.

## Pre-decisions
Decision: Terminal state name
Choice: `confirmed`
Rationale: Clear, explicit, and distinct from `confirming`; avoids reusing `pending_approval`.

Decision: Existing quotation tables
Choice: Leave legacy tables in existing local DBs untouched; new code never reads/writes them.
Rationale: Avoid destructive migration of prototype data; no runtime dependency remains.

Decision: Flagged requests
Choice: Allow confirmation and reply that the team will review the noted flags.
Rationale: No staff approval queue exists; blocking confirmation would dead-end the chat.

Decision: Marketing homepage
Choice: Leave unchanged.
Rationale: User selected demo + storyboard scope only.

## Verification checkpoints
| After | Verify |
|---|---|
| Types/workflow/agent | `npm run check` |
| Data/API | `npm run check`; start demo and complete a web chat |
| UI | `npm run build`; Playwright desktop/mobile flow |
| Removal | `npm run check`, `npm run build`, no imports of deleted modules |
| Full flow | Playwright web + WhatsApp confirmation tests pass |

## Acceptance criteria
- A service request triggers identity verification before sample details.
- Missing identity/service details are asked again, not accepted silently.
- A complete request ends with a confirmation summary and a single final confirmation reply.
- No email address is requested at any point.
- No quotation, PDF, order, or staff approval record is created.
- WhatsApp `NEW`/`START` restarts a confirmed chat.
- Existing website enquiry and staff enquiry flows still work.
- `npm run check` and `npm run build` pass.
- New feature tests fail if the confirmation-only behavior is removed.

## Task breakdown
1. Update types, workflow, agent.
2. Simplify data layer and reset.
3. Update web components and storyboard.
4. Remove quotation/email/PDF/staff approval code and dependencies.
5. Update tests, docs, env, Playwright config.
6. Run check, build, and focused E2E tests.
