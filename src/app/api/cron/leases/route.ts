import { flagLeasesEnteringRenewalWindow, expireNotRenewingLeases } from "@/lib/leases/run";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const flagResult = await flagLeasesEnteringRenewalWindow(now);
  const expireResult = await expireNotRenewingLeases(now);

  return Response.json({ ...flagResult, ...expireResult });
}
