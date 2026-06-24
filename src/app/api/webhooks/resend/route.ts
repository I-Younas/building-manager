import { Webhook } from "svix";
import { prisma } from "@/lib/db";

type ResendWebhookEvent = {
  type: string;
  data: { email_id?: string };
};

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Webhook not configured", { status: 500 });
  }

  const payload = await request.text();
  const headers = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  let event: ResendWebhookEvent;
  try {
    event = new Webhook(secret).verify(payload, headers) as ResendWebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 401 });
  }

  const messageId = event.data.email_id;
  if (!messageId) {
    return Response.json({ ok: true });
  }

  const now = new Date();
  switch (event.type) {
    case "email.delivered":
      await prisma.announcementDelivery.updateMany({
        where: { resendMessageId: messageId },
        data: { status: "DELIVERED", deliveredAt: now },
      });
      break;
    case "email.bounced":
      await prisma.announcementDelivery.updateMany({
        where: { resendMessageId: messageId },
        data: { status: "BOUNCED", bouncedAt: now },
      });
      break;
    case "email.opened":
      await prisma.announcementDelivery.updateMany({
        where: { resendMessageId: messageId },
        data: { openedAt: now },
      });
      break;
    case "email.clicked":
      await prisma.announcementDelivery.updateMany({
        where: { resendMessageId: messageId },
        data: { clickedAt: now },
      });
      break;
    default:
      break;
  }

  return Response.json({ ok: true });
}
