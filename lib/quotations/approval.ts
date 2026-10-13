import { getConversation, getQuotation } from "@/lib/demo/data";
import { quotationPdf } from "@/lib/demo/pdf";
import { emailConfiguration, sendQuotationEmail } from "./email";
import { claimSend, recordFailed, recordSent, rejectQuotation } from "./store";

export class ApprovalError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}
export type ApprovalAction = "approve" | "retry" | "reject";

// CONTRACT
// GUARANTEES: approval/rejection and email attempts are persisted; stable PDF/from/recipient and key
//   make retries safe within the provider window. Concurrent approval has at most one claimed send.
// EXPECTS: authenticated, same-origin staff caller; reviewed=true for identities/flags needing review.
// FAILURE BEHAVIOR: configuration errors leave pending intact; provider errors persist email_failed.
// DOES NOT: create orders, send chat quotations, modify customer records or infer inbox delivery.
// KNOWN LIMITATIONS: retry after 23h requires manual provider reconciliation; no background scheduler.
export async function actOnQuotation(id: string, action: ApprovalAction, reviewed: boolean, reason?: string) {
  const quotation = await getQuotation(id);
  if (!quotation?.recipient) throw new ApprovalError("Quotation not found.", 404);
  if (quotation.status === "sent" && action !== "reject") return { status: "sent", providerId: quotation.providerId };
  if (action === "reject") {
    if (!reason?.trim() || reason.trim().length > 500) throw new ApprovalError("A rejection reason of 1–500 characters is required.", 400);
    if (!(await rejectQuotation(id, reason.trim()))) throw new ApprovalError("Only a pending quotation can be rejected.", 409);
    return { status: "rejected" };
  }
  const conversation = await getConversation(quotation.conversationId);
  if (!conversation || conversation.state !== "pending_approval" || conversation.draft.workflowVersion !== 2) throw new ApprovalError("This enquiry is not ready for approval.", 409);
  if ((conversation.draft.verification !== "verified" || conversation.needsStaff) && !reviewed) {
    throw new ApprovalError("Review the customer identity and staff flags before approving.", 400);
  }
  const config = emailConfiguration();
  if (!config) throw new ApprovalError("Email sending is not configured. Set RESEND_API_KEY and QUOTATION_EMAIL_FROM.", 503);
  if (action === "retry" && quotation.approvedAt && Date.now() - Date.parse(quotation.approvedAt) >= 23 * 60 * 60 * 1000) {
    throw new ApprovalError("The safe retry window has expired. Check the email provider for acceptance before arranging another send.", 409);
  }
  const attachment = quotation.attachmentBase64 ?? Buffer.from(await quotationPdf(quotation)).toString("base64");
  const claimed = await claimSend(id, action, attachment, config.from);
  if (!claimed) throw new ApprovalError("The quotation is already being processed or cannot take this action. Refresh the queue.", 409);
  let providerId: string;
  try {
    providerId = await sendQuotationEmail({ from: claimed.emailFrom!, to: claimed.recipient!, quotationId: id,
      customerName: claimed.customerName, attachmentBase64: claimed.attachmentBase64! });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email submission failed.";
    if (!(await recordFailed(id, claimed.sendToken!, message))) throw new ApprovalError("This email attempt was superseded. Refresh the queue.", 409);
    throw new ApprovalError(message, 502);
  }
  // If this write fails after acceptance, leave 'sending'. A stale-lease retry uses the same payload/key.
  if (!(await recordSent(id, claimed.sendToken!, providerId))) throw new ApprovalError("This email attempt was superseded. Refresh the queue.", 409);
  return { status: "sent", providerId };
}
