# Approved quotation workflow — implementation plan

## Requirements / problem model
- R1: Customer first requests services in a message.
- R2: Verify name, phone number and GST against the customer database, not AI judgement.
- R3: Check requested services against the lab catalogue; unsupported services require staff.
- R4: Collect sample type and count and ask for explicit confirmation of the service/sample summary.
- R5: Ask for delivery email only after confirmation (even when an email appeared earlier).
- R6: Final chat message: “Your quotation will be emailed to you after approval.”
- R7: Staff review PDF, approve/send or reject; customer chat cannot approve or create an order.
- R8: Persist approval and delivery state; failed deliveries can be retried without duplicate sends.
- R9: Transfer the private GitHub repository to CosmIQ-OS and verify owner/remote.
- R10: Verify pure rules, API permissions, full browser journeys and email/PDF transport.

## Discovery memo and layers
Existing reusable boundaries: pure workflow/verification/pricing, Gemini extraction with offline fallback,
Postgres storage, PDF rendering, signed staff sessions. AI extracts only; deterministic code checks records.
Volatile email-provider details belong in one transport adapter. DB failures must not imply delivery;
provider acceptance means submitted, not guaranteed inbox receipt. Customer history stays hidden on mismatch.
Layers: extraction -> pure decisions -> agent orchestration -> Postgres; approval service -> email adapter.

## Candidates / recommendation
1. Extend the current pure workflow and add a staff approval service with atomic DB claims. Best fit:
   preserves existing boundaries and needs no new infrastructure.
2. Separate queued worker/email pipeline. Better automatic recovery but requires deployment/scheduler
   infrastructure this repository lacks. Defer; persisted states and staff retry cover this scope.
Chosen: (1). No real WhatsApp integration, LIMS connection or deployment changes in this task.

## Models / migration
Draft adds phone; states: requesting -> identify -> collecting -> confirming -> email -> pending_approval.
Verified records populate company from DB, not a new mandatory customer question. Unknown customers are
unverified/new and need staff review; matching identity is not proof of phone ownership (no OTP).
Quotations add recipient, approval/sent timestamps, provider ID, delivery error, stored PDF attachment,
and send lease. Status: pending_approval / sending / email_failed / sent / rejected (legacy rows retained).
Idempotent additive schema changes retain old rows; old in-progress conversations require a new chat.
Atomic token-fenced conversation leases prevent overlapping or stale updates. Workflow version 2 explicitly
rejects legacy draft shapes. Submission commits quotation, terminal draft, messages and flags atomically;
reset locks conversations/quotations before checking unresolved emails. Quote numbers use a DB sequence starting above
legacy numbers. One new-workflow quote per conversation prevents retry duplicates.

## Contracts / orchestration
- nextStep(ctx, extraction): catalogue-only selections; identity before availability confirmation;
  explicit summary confirmation before email; terminal submission immutable; no I/O, prices or approval.
- agent: request -> name/phone/GST lookup -> catalogue/sample collection -> confirmation -> email ->
  deterministic quote persisted pending approval. Never attach a quote or create orders in chat.
- GET /api/staff/quotations: authenticated list; GET /api/staff/quotations/:id/pdf: authenticated preview.
- POST /api/staff/quotations/:id: authenticated, same-origin {action: approve|retry|reject}; reject only
  pending, CAS claim prevents double send; failures visible; repeated sent approvals are no-ops.
- Email adapter: Resend REST, PDF attachment, stable idempotency key/payload, bounded timeout;
  missing configuration fails closed. A local HTTP boundary exercises transport only in tests.
- Approval service: persists stable PDF before first attempt; records provider acceptance. Stale sending
  leases recover through retry within provider's 24-hour idempotency window; outside window, refuse
  automatic resend and require reconciliation. Sending is never reported as delivered.

## Pre-decisions / assumptions
Phone is entered explicitly in web chat; real WhatsApp metadata is unavailable. Optional no-GST path
remains supported but requires staff review. Existing sample data and prototype labels are preserved.
Sender: Resend (isolated REST adapter); no existing provider/configuration was found. Live email testing
requires credentials and a verified sender; all automated sends use a local capture server instead.
Staff reuse existing shared-password session; rejection requires a reason. Reset requires staff since
approval records must not be removable by a customer/demo-only session.
Transfer changes owner/remote only; implementation will not be silently committed, pushed or deployed.

## Tasks / checkpoints
1. Types, parser and verification -> pure rule tests.
2. Workflow and agent -> type check and request-to-pending integration tests.
3. Additive data migration, approval claims, stable attachment, transport -> concurrent/failure tests.
4. Staff API/UI and demo state labels -> auth, rejection and browser approval tests.
5. Documentation, regressions and repo transfer verification -> check, production build, full Playwright.
All tasks owned by the main agent; independent review only after implementation.

## Acceptance / failure analysis
New test must prove service-first -> identity -> confirmation -> email -> pending -> staff approval ->
captured PDF email; no email exists before approval. Retry uses the same key and attachment; double
approval has one effect. Test wrong phone/GST, unknown services/samples, invalid counts/email, denied
and cross-origin approvals, rejection, provider failure, missing sender, stale sending lease, refresh,
mobile chat/approval and existing website/enquiry regressions. Never use a production DB for tests;
explicitly clear DATABASE_URL and VERCEL from test-server environment.

## Rollback / limitations
Additive columns tolerate older code, but rolling back revives the old immediate-quote flow and is not
appropriate after real submissions; restore only before enabling this workflow. No automatic scheduler,
provider delivery webhooks or phone OTP are added. Provider acceptance is shown as email submitted.

## Verification record
- `npm run check` and production `npm run build`: passed.
- Full Playwright suite: 71 passed; 31 intentional project/device-specific duplicate skips.
- Independent code review: five reliability findings fixed and covered with real-DB fault/race tests;
  follow-up review found only the email-keyword parsing issue, which is also fixed and covered.
- Maximum catalogue PDF (all five tests, 50 samples) rendered and inspected; no clipped line items/totals.
- GitHub owner is `CosmIQ-OS/cosmiq-os-web`, visibility still private; local origin updated;
  existing Vercel GitHub Actions secret names survived transfer.
- Live Resend, hosted Neon, Gemini and WhatsApp/LIMS were not exercised: no provider/sender credentials
  were configured locally. Automated sending used only the loopback capture server. Production
  publication is a separate verification checkpoint using the existing GitHub Actions/Vercel pipeline.

## Follow-up retest scope (user request)
- Expand tests for malformed/non-object JSON, unknown customers, message limits, session expiry,
  tampering, cross-purpose cookies, declined/repeated confirmations and corrected unsupported samples.
- Add boundary-count/duplicate-service checks and real-DB approval tests for mixed unsupported services,
  immutable sender across retries, and rejection after sending.
- Confirmed defects: malformed conversation JSON currently creates a new chat (201), and a well-formed
  but absent customer ID returns 500. Fix shared JSON parsing to reject arrays; conversation creation must
  require an object body and return 404 for an absent record before calling the agent.
- Preserve existing valid `{customerId: null}` / `{customerId: 'C001'}` behaviour, all state-machine rules,
  authentication, pricing and approval invariants. No production reset or real-email send during retesting.
- Verify targeted failing tests, then typecheck/build/full suite and non-destructive live smoke checks.

## GST-loop investigation and fix
User reported repeated GST prompts. Parser regression tests confirm separator-formatted GST numbers are
discarded and phrases such as "GST not available" are not recognised. The latter can also overwrite the
already collected name. A valid plain GST and standard "no GST" are the controls.
- Add a specific `gstNo` awaiting step when name/phone are present and only GST is missing.
- Normalise valid copy-pasted GST separators before validation; recognise explicit non-registration
  phrases and contextual N/A/none replies without treating them as names.
- Add optional `gstFormatAttempts` to version-2 drafts (default zero for existing chats). Two unreadable
  GST replies hand over GST verification to staff instead of indefinitely prompting. Name and valid phone
  remain mandatory. Missing/unreadable GST must never result in an automatically verified customer.
- Preserve deterministic catalogue/pricing/approval rules. Staff must review incomplete/unverified identity
  before email approval. No OTP or new identity provider is added.
- Verify parser forms, split-field flows, no-GST replies, retained names, valid correction after one bad
  reply, bounded invalid-reply handover, mismatch retry limits and existing regression suite.
- Live diagnostic confirmed Gemini initially reads valid messages, then hits a rate limit. The deployed
  fallback repeats GST prompts for hyphenated GST, GST-not-available, N/A and invalid GST. Diagnostic chats
  use seeded/fictional identities only; no quotation, order or email was created.
- Expanded local production build/typecheck and regression run: 114 passed; 52 intentional duplicate/device
  skips. Covers the GST handover and resumption paths as well as the two JSON/customer validation fixes.
- Review follow-ups fixed and regression-tested: GST-only numeric replies cannot overwrite the saved phone;
  greetings/discounts/urgency retain their intents and do not consume GST format attempts.
