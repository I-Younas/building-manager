import { runDueAnnouncements, sendAcknowledgmentReminders } from "@/lib/announcements/send";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const dueResult = await runDueAnnouncements(now);
  const reminderResult = await sendAcknowledgmentReminders(now);

  return Response.json({ ...dueResult, ...reminderResult });
}
