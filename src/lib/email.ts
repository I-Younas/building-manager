import "server-only";
import { Resend } from "resend";

let client: Resend | null = null;

function getClient() {
  if (client) return client;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  client = new Resend(apiKey);
  return client;
}

export async function sendInviteEmail({
  to,
  organizationName,
  inviteUrl,
}: {
  to: string;
  organizationName: string;
  inviteUrl: string;
}) {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is not configured.");
  }

  const { error } = await getClient().emails.send({
    from,
    to,
    subject: `You've been invited to join ${organizationName} on Building Manager`,
    text: `You've been invited to join ${organizationName} on Building Manager.\n\nFollow this link to set up your account:\n${inviteUrl}\n\nThis link expires in 7 days.`,
    html: `<p>You&apos;ve been invited to join <strong>${organizationName}</strong> on Building Manager.</p><p><a href="${inviteUrl}">Click here to set up your account</a></p><p>This link expires in 7 days.</p>`,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendAnnouncementEmail({
  to,
  subject,
  bodyHtml,
  attachments,
  replyTo,
}: {
  to: string;
  subject: string;
  bodyHtml: string;
  attachments?: { filename: string; url: string }[];
  replyTo?: string;
}) {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is not configured.");
  }

  const attachmentsHtml = attachments?.length
    ? `<p>Attachments:</p><ul>${attachments
        .map((a) => `<li><a href="${a.url}">${a.filename}</a></li>`)
        .join("")}</ul>`
    : "";

  const { data, error } = await getClient().emails.send({
    from,
    to,
    subject,
    replyTo,
    html: `${bodyHtml}${attachmentsHtml}`,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { messageId: data?.id ?? null };
}

export async function sendContactInfoChangedEmail({
  to,
  residentName,
  emailChange,
  phoneChange,
}: {
  to: string;
  residentName: string;
  emailChange?: { from: string; to: string };
  phoneChange?: { from: string | null; to: string };
}) {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is not configured.");
  }

  const lines: string[] = [];
  if (emailChange) lines.push(`Email: ${emailChange.from} → ${emailChange.to}`);
  if (phoneChange) lines.push(`Phone: ${phoneChange.from ?? "(none)"} → ${phoneChange.to}`);

  const { error } = await getClient().emails.send({
    from,
    to,
    subject: `${residentName} updated their contact information`,
    text: `${residentName} updated their contact information on Building Manager:\n\n${lines.join("\n")}`,
    html: `<p><strong>${residentName}</strong> updated their contact information on Building Manager:</p><ul>${lines
      .map((line) => `<li>${line}</li>`)
      .join("")}</ul>`,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendPasswordResetEmail({ to, resetUrl }: { to: string; resetUrl: string }) {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is not configured.");
  }

  const { error } = await getClient().emails.send({
    from,
    to,
    subject: "Reset your Building Manager password",
    text: `We received a request to reset your Building Manager password.\n\nFollow this link to choose a new password:\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    html: `<p>We received a request to reset your Building Manager password.</p><p><a href="${resetUrl}">Click here to choose a new password</a></p><p>This link expires in 1 hour. If you didn&apos;t request this, you can ignore this email.</p>`,
  });

  if (error) {
    throw new Error(error.message);
  }
}
