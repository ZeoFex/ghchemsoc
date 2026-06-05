import nodemailer from "nodemailer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailMode = "smtp" | "resend" | "logged";

export type SendEmailResult =
  | { ok: true; mode: SendEmailMode; id?: string }
  | { ok: false; error: string };

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
};

function getEmailFrom(): string | undefined {
  return (
    process.env.SMTP_FROM?.trim() ??
    process.env.MEMBERSHIP_EMAIL_FROM?.trim() ??
    process.env.EMAIL_FROM?.trim()
  );
}

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) return null;

  const port = Number(process.env.SMTP_PORT?.trim() || "587");
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const secure =
    process.env.SMTP_SECURE?.trim() === "true" || (Number.isFinite(port) && port === 465);

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
    user: user || undefined,
    pass: pass || undefined,
  };
}

async function sendViaSmtp(
  input: SendEmailInput,
  from: string,
  smtp: SmtpConfig
): Promise<SendEmailResult> {
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.user && smtp.pass ? { user: smtp.user, pass: smtp.pass } : undefined,
  });

  try {
    const info = await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { ok: true, mode: "smtp", id: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "SMTP send failed";
    return { ok: false, error: message };
  }
}

async function sendViaResend(
  input: SendEmailInput,
  from: string,
  apiKey: string
): Promise<SendEmailResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!res.ok) {
    let detail = await res.text();
    try {
      const parsed = JSON.parse(detail) as { message?: string };
      if (parsed.message) detail = parsed.message;
    } catch {
      /* plain text */
    }
    return { ok: false, error: detail || `Email provider error (${res.status})` };
  }

  const data = (await res.json()) as { id?: string };
  return { ok: true, mode: "resend", id: data.id };
}

function logDevEmail(input: SendEmailInput, to: string): SendEmailResult {
  console.info(
    "[email:dev] — not sent (configure SMTP_* or RESEND_API_KEY + email FROM to send for real)"
  );
  console.info("[email:dev] To:", to);
  console.info("[email:dev] Subject:", input.subject);
  console.info("[email:dev]\n", input.text);
  return { ok: true, mode: "logged" };
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const to = input.to.trim();
  if (!isValidEmail(to)) {
    return { ok: false, error: "Invalid recipient email address." };
  }

  const from = getEmailFrom();
  const smtp = getSmtpConfig();
  const resendKey = process.env.RESEND_API_KEY?.trim();

  if (smtp && from) {
    return sendViaSmtp(input, from, smtp);
  }

  if (resendKey && from) {
    return sendViaResend(input, from, resendKey);
  }

  if (process.env.NODE_ENV === "development") {
    return logDevEmail(input, to);
  }

  return {
    ok: false,
    error:
      "Email is not configured. Set SMTP_HOST + SMTP_FROM (or RESEND_API_KEY + MEMBERSHIP_EMAIL_FROM) in your environment.",
  };
}
