# Service-first approved quotation workflow

Source: `tasks/2026-10-13-approved-quotations.plan.md` (R1–R10) and
`tasks/2026-11-01-whatsapp-cloud-api.plan.md` (real WhatsApp channel).

## Problem / actors
Customers describe services, provide identity, confirm samples and supply email. Staff decide whether the
prepared quotation is appropriate and authorize sending. Catalogue/customer records, not AI, are truth.
Invariant: no customer message can approve, send a quotation or create an order.

## Decisions and boundaries
Reuse the existing layer-first design rather than adding an event bus/worker: extraction -> pure workflow
-> agent orchestration -> Postgres. Approval uses a separate privileged orchestration -> email transport.
This is simpler to deploy here; automatic background retries would require new scheduling infrastructure.

- `extract.ts` / `parse-fallback.ts`: message -> sanitized fields. Gemini timeout falls back to keyword rules.
- `workflow.ts`: pure transitions and catalogue/sample validation. `requesting -> identify -> collecting
  -> confirming -> email -> pending_approval`. Selection changes invalidate confirmation. Terminal drafts freeze.
  Identity uses a dedicated GST-only awaiting step; an optional format-attempt counter defaults to zero
  for existing version-2 drafts. Two unreadable GST replies hand over for staff verification, never automatic
  verification. Name and valid phone remain required; GST replies cannot overwrite the collected name.
- `verify.ts`: record matching for full name, normalized phone and GST. No email requirement, AI judgement or OTP.
- `agent.ts`: loads records, executes verification, persists messages/trace and deterministic pending quotes.
- `pricing.ts`: database-backed numbers only. `pdf.ts`: quotation rendering; prototype labels are preserved.
- `data.ts`: additive schema, immutable seed records, token-fenced DB conversation leases; conversation,
  quotation, messages and events commit in one atomic batch. Reset locks conversations/quotations before
  checking unresolved sends and deleting. Version-2 gates hide history/prevent resuming legacy chats.
- `../quotations/store.ts`: owns compare-and-set send/reject transitions and staff queue views.
- `../quotations/approval.ts`: pending -> sending -> sent/email_failed; staff-reviewed flags required.
- `../quotations/email.ts`: Resend transport, timeout and provider acceptance; knows nothing about workflow.
- `../quotations/route.ts`: staff-only/same-origin action boundary. Pending PDF previews require staff.

## Failures / lifecycle
No match hides history and requires staff review. Invalid details are still missing. Offline AI does not stop
the workflow. GST whitespace/hyphens are normalised, explicit non-registration and contextual N/A replies
are recognised, and repeated unreadable GST is staff-reviewed instead of prompting indefinitely. Missing
sender settings leave pending intact. Approval snapshots the PDF/from/recipient; retries
use the same provider key and bytes. CAS prevents overlapping sends; expired send leases permit manual retry.
Provider errors are visible, not success. Completion writes require the current attempt token, so delayed
failures cannot overwrite a reclaimed attempt. A post-acceptance DB failure leaves `sending` for idempotent recovery.
The 23-hour retry bound avoids duplicate email beyond Resend's 24-hour retention. No inbox-delivery claim.

- `app/api/whatsapp/webhook/route.ts`: Meta verification + HMAC boundary; maps a `wa_id` to one active
  conversation, stores the reply before sending, and deduplicates Meta message ids. Text only.
- `../whatsapp/`: Cloud API adapter and payload parsing. Missing configuration fails closed; a loopback
  Graph API URL is test-only and ignored on Vercel.

## Assumptions / limitations
Web chat types the phone; WhatsApp uses the sender's `wa_id` as the phone. Neither is OTP. Sample records
remain illustrative. Existing signed shared-password staff sessions are reused. No media messages, PDF
delivery on WhatsApp, staff WhatsApp alerts or LIMS connection. A completed WhatsApp chat is terminal
until the customer replies `NEW`/`START`. Old chat states cannot safely resume; start a new chat.
Additive schema preserves older quotation rows.

## Validation
Pure workflow/parser/pricing tests, real isolated Postgres orchestration tests, local HTTP provider capture,
and desktop/mobile browser journeys exercise R1–R8/R10. Repository owner/remote verified separately for R9.
Actual provider integrations require credentials and a verified sender; tests must never use production DBs.
