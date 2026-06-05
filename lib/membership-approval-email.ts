import { sendEmail, isValidEmail, type SendEmailMode } from "@/lib/send-email";

export function buildMemberLoginUrl(baseUrl: string, memberId: string, email: string): string {
  const params = new URLSearchParams({
    role: "member",
    memberId,
    email: email.trim().toLowerCase(),
  });
  return `${baseUrl.replace(/\/$/, "")}/login?${params.toString()}`;
}

export type MembershipApprovalEmailContent = {
  to: string;
  subject: string;
  text: string;
  html: string;
  loginUrl: string;
};

export function buildMembershipApprovalEmail(params: {
  baseUrl: string;
  fullName: string;
  email: string;
  memberId: string;
  applicationId: string;
}): MembershipApprovalEmailContent {
  const loginUrl = buildMemberLoginUrl(params.baseUrl, params.memberId, params.email);
  const subject = "Your Ghana Chemical Society membership is approved";

  const text = `Dear ${params.fullName},

Your membership payment has been verified and your application is approved.

Member ID: ${params.memberId}
Application reference: ${params.applicationId}

Sign in to open your member portfolio:
${loginUrl}

Use this email address (${params.email}) and your member ID when signing in.

Ghana Chemical Society`;

  const html = `<!DOCTYPE html>
<html lang="en">
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#0f172a;max-width:32rem;margin:0 auto;padding:1.5rem">
  <p>Dear ${escapeHtml(params.fullName)},</p>
  <p>Your membership payment has been verified and your application is <strong>approved</strong>.</p>
  <table style="width:100%;border-collapse:collapse;margin:1.25rem 0">
    <tr>
      <td style="padding:0.5rem 0;color:#64748b;font-size:0.875rem">Member ID</td>
      <td style="padding:0.5rem 0;font-family:ui-monospace,monospace;font-weight:700;color:#1d4ed8">${escapeHtml(params.memberId)}</td>
    </tr>
    <tr>
      <td style="padding:0.5rem 0;color:#64748b;font-size:0.875rem">Reference</td>
      <td style="padding:0.5rem 0;font-family:ui-monospace,monospace;font-size:0.8125rem">${escapeHtml(params.applicationId)}</td>
    </tr>
  </table>
  <p>
    <a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:0.75rem 1.25rem;border-radius:0.75rem;font-weight:600">Sign in to your account</a>
  </p>
  <p style="font-size:0.875rem;color:#64748b">Or copy this link:<br><a href="${escapeHtml(loginUrl)}">${escapeHtml(loginUrl)}</a></p>
  <p style="font-size:0.875rem;color:#64748b">Use <strong>${escapeHtml(params.email)}</strong> and your member ID when signing in.</p>
  <p style="margin-top:2rem;font-size:0.875rem;color:#94a3b8">Ghana Chemical Society</p>
</body>
</html>`;

  return { to: params.email.trim().toLowerCase(), subject, text, html, loginUrl };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendMembershipApprovalEmail(params: {
  baseUrl: string;
  fullName: string;
  email: string;
  memberId: string;
  applicationId: string;
}): Promise<
  | { sent: true; mode: SendEmailMode; preview: MembershipApprovalEmailContent }
  | { sent: false; error: string; preview?: MembershipApprovalEmailContent }
> {
  if (!isValidEmail(params.email)) {
    return { sent: false, error: "Application email address is not valid — member was approved but no email was sent." };
  }

  const preview = buildMembershipApprovalEmail(params);
  const result = await sendEmail({
    to: preview.to,
    subject: preview.subject,
    html: preview.html,
    text: preview.text,
  });

  if (!result.ok) {
    return { sent: false, error: result.error, preview };
  }

  return { sent: true, mode: result.mode, preview };
}
