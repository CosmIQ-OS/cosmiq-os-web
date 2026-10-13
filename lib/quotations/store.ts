import { query } from "@/lib/db";
import crypto from "node:crypto";
import { toQuotation } from "@/lib/demo/data";

export async function listQuotations() {
  const rows = await query(`SELECT q.*, c.draft, c.needs_staff,
    ARRAY(SELECT e.label FROM demo_events e WHERE e.conversation_id = q.conversation_id AND e.kind = 'flag' ORDER BY e.id) AS staff_flags
    FROM demo_quotations q
    JOIN demo_conversations c ON c.id = q.conversation_id
    WHERE q.recipient IS NOT NULL ORDER BY q.created_at DESC`);
  return rows.map((row) => {
    const { attachmentBase64: _attachment, ...quotation } = toQuotation(row);
    const draft = typeof row.draft === "string" ? JSON.parse(row.draft) : row.draft;
    return { ...quotation, verification: draft.verification as string, phone: draft.phone as string | null, needsStaff: Boolean(row.needs_staff), flags: row.staff_flags as string[] };
  });
}
export type ApprovalRow = Awaited<ReturnType<typeof listQuotations>>[number];

// CAS is the sole owner of transitions; two server processes cannot both claim the same email.
export async function claimSend(id: string, action: "approve" | "retry", attachment: string, from: string) {
  const allowed = action === "approve" ? "status = 'pending_approval'" :
    "(status = 'email_failed' OR (status = 'sending' AND send_started_at < now() - interval '2 minutes')) AND approved_at > now() - interval '23 hours'";
  const [row] = await query(`UPDATE demo_quotations SET status = 'sending',
    attachment_base64 = coalesce(attachment_base64, $2), email_from = coalesce(email_from, $3),
    approved_at = coalesce(approved_at, now()), send_started_at = now(), send_token = $4, delivery_error = NULL
    WHERE id = $1 AND ${allowed} RETURNING *`, [id, attachment, from, crypto.randomUUID()]);
  return row ? toQuotation(row) : null;
}
export async function recordSent(id: string, token: string, providerId: string): Promise<boolean> {
  const rows = await query(`UPDATE demo_quotations SET status = 'sent', sent_at = now(), provider_id = $3, delivery_error = NULL
    WHERE id = $1 AND send_token = $2 AND status = 'sending' RETURNING id`, [id, token, providerId]);
  return rows.length === 1;
}
export async function recordFailed(id: string, token: string, message: string): Promise<boolean> {
  const rows = await query(`UPDATE demo_quotations SET status = 'email_failed', delivery_error = $3
    WHERE id = $1 AND send_token = $2 AND status = 'sending' RETURNING id`, [id, token, message]);
  return rows.length === 1;
}
export async function rejectQuotation(id: string, reason: string): Promise<boolean> {
  const rows = await query(`UPDATE demo_quotations SET status = 'rejected', delivery_error = $2
    WHERE id = $1 AND status = 'pending_approval' RETURNING id`, [id, reason]);
  return rows.length === 1;
}
