# Real WhatsApp channel for the food-lab pilot — implementation plan

## Requirements / problem model
- R1: A real WhatsApp text message from an approved test recipient reaches the existing FQLab workflow.
- R2: The bot replies on WhatsApp with the same deterministic replies used by the web chat.
- R3: Conversation context persists per WhatsApp number across messages.
- R4: Meta webhook verification and `X-Hub-Signature-256` validation are mandatory.
- R5: Duplicate Meta deliveries never advance the workflow twice or send duplicate replies.
- R6: The simulated web demo keeps working unchanged.
- R7: The integration is opt-in; without WhatsApp env vars the webhook fails closed and nothing else changes.
- R8: Setup works with Meta's free test number, no card and no paid subscription.

## Discovery memo and layers
The pilot already separates extraction -> pure workflow -> agent orchestration -> Postgres. WhatsApp is
only a transport at the edge. Reuse `handleMessage`; do not duplicate workflow rules or pricing.
The web chat is authenticated by a demo cookie. Meta cannot send that cookie, so the webhook uses its
own boundary: verify token on GET, HMAC app-secret signature on POST, then server-side processing.
Outbound sending is a single adapter, mirroring `lib/quotations/email.ts`, with a loopback-only test URL.
The real channel differs from the web demo in two intentional ways: the WhatsApp number is trusted
channel metadata (pre-filled as the customer's phone), and replies are plain text (no chips/cards/PDF).

## Pre-decisions / assumptions
- Work in `cosmiq-os-web`; the older `cosmiq-os` static landing page is not changed.
- Provider: Meta WhatsApp Cloud API, Graph version `v26.0` (configurable), free test number.
- Text messages only. Images, voice notes, documents and interactive replies are out of scope.
- One active conversation per WhatsApp number. A completed (`pending_approval`) chat is terminal;
  the customer replies `NEW` (or `START`) to open a fresh enquiry. Old conversations are detached,
  not deleted, so staff can still see their quotation.
- The WhatsApp `wa_id` (digits with country code) pre-fills `draft.phone`. Identity still requires
  name + GST; this is not OTP and does not prove more than the channel does.
- Quotation delivery remains email via the existing staff-approved flow. No PDF is sent on WhatsApp.
- No new npm dependencies. No Gemini requirement; the offline parser is enough.
- Staff are not notified on WhatsApp. The existing `/staff/quotations` queue remains the approval surface.
- Reuse the local Meta test credentials already present in `whatsapp-gemini-bot` if the owner agrees;
  never copy secrets into the repository.

## Models / migration (additive)
`demo_conversations` gains:
- `channel TEXT NOT NULL DEFAULT 'web'`
- `external_id TEXT` (WhatsApp `wa_id`)
- unique partial index `(external_id) WHERE channel = 'whatsapp'`

`whatsapp_inbound` (new):
- `message_id TEXT PRIMARY KEY` — Meta message id, the idempotency key
- `conversation_id TEXT` — set once the workflow has run
- `reply TEXT` — the exact outbound text, stored before sending
- `status TEXT NOT NULL` — `processing | ready | done | failed`
- `created_at`, `updated_at TIMESTAMPTZ`

`resetDemo()` also deletes `whatsapp_inbound` rows.

## Contracts / orchestration
- `whatsappConfiguration()` -> `{ accessToken, phoneNumberId, appSecret, verifyToken, graphVersion, apiUrl } | null`.
  Missing any required value means the webhook returns 503 and sending throws.
- `verifyWebhookSignature(rawBody, header, appSecret)` -> boolean. Constant-time compare; malformed header false.
- `verifyChallenge(mode, token, challenge)` -> challenge only when mode is `subscribe` and token matches.
- `parseInbound(payload)` -> `[{ messageId, from, text }]`, defensive shape checks; ignores statuses and non-text.
- `sendWhatsAppText(waId, body)` -> provider message id; 10s timeout; test URL override only for loopback
  and never on Vercel; never logs the token or full phone number.
- `startWhatsAppConversation(waId)` -> `{ id, greeting }`; creates with channel/external_id and pre-filled
  phone, stores the greeting, or returns the existing active conversation.
- `restartWhatsAppConversation(waId)` -> detaches the active conversation (`external_id = NULL`) and creates
  a new one atomically enough for a pilot; unique index resolves first-message races.
- `handleWhatsAppMessage(conversationId, text)` -> new agent message bodies after the call; wraps
  `handleMessage` without changing its boolean contract.
- `claimInboundMessage(messageId)` -> `new | retry | ready | done | busy` using the `whatsapp_inbound` row.
- Route `GET/POST /api/whatsapp/webhook`, `runtime = nodejs`, `maxDuration = 60`.
  GET: verify challenge. POST: raw body -> signature -> parse -> per message:
  claim -> ensure conversation (restart on `NEW` when terminal) -> workflow -> store reply -> send -> done.
  Send failure leaves status `ready` and returns 500 so Meta retries and the stored reply is resent.
  A fresh `processing` duplicate returns 503; a stale one (>90s) may be reclaimed.

## Boundaries
IN SCOPE: new WhatsApp config/client/webhook/parser, additive schema, agent helpers, env docs,
Playwright mock WhatsApp server and webhook tests.
OUT OF SCOPE: web UI redesign, media/templates/interactive messages, staff WhatsApp alerts, PDF on
WhatsApp, LIMS connection, email/approval changes, deployment.
MUST NOT CHANGE: `handleMessage` semantics, pure workflow/pricing/verification rules, staff approval
boundaries, existing demo routes/cookies, `next.config.js`.
MUST FOLLOW: additive schema, atomic DB writes, fail-closed security, no secrets client-side,
loopback-only test override, Next.js 16 route-handler conventions.

## Verification checkpoints
1. Config + client -> unit/type check.
2. Schema + data helpers -> real PGlite integration through the existing tests.
3. Agent helpers -> existing agent tests still pass; new webhook test starts a conversation.
4. Route wired -> signed POST returns 200 and the mock Graph API receives the greeting/reply.
5. Full flow -> a four-message conversation ends with the pending-approval reply.
6. Security -> bad signature 401, wrong verify token 403, duplicate delivery no-op.
7. Regression -> `npm run check`, `npm run build`, full Playwright suite.
8. Manual -> cloudflared + Meta test number; send a real WhatsApp message and receive a reply.

## Task breakdown
1. Add env keys and WhatsApp config/client. (builder)
2. Add schema, inbound claim helpers and conversation channel helpers. (builder)
3. Add WhatsApp agent helpers and terminal restart. (builder)
4. Add webhook route and parser/security helpers. (builder)
5. Add mock WhatsApp server + Playwright webhook tests; wire config. (builder)
6. Update README and `.env.example` with the free test-number setup. (runner)
7. Run check/build/e2e, then manual Meta test. (orchestrator)

## Rollback / limitations
Without `WHATSAPP_*` env vars the webhook returns 503 and no existing path changes. Schema additions are
additive. Removing the route/env disables the channel; old WhatsApp conversations remain readable by id.
No automatic retry worker: retries rely on Meta's webhook retries plus the stored `ready` reply.
The test number only messages approved recipients and temporary tokens expire; production requires a
permanent token, a real business number and Meta review. Provider acceptance is not delivery.
