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
