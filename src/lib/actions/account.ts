"use server";

import { revalidatePath } from "next/cache";
import { requireOrgScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { updateContactInfoSchema } from "@/lib/validation/account";
import { sendContactInfoChangedEmail } from "@/lib/email";

export type UpdateContactInfoState = { error: string } | { success: true } | undefined;

export async function updateContactInfo(
  _prevState: UpdateContactInfoState,
  formData: FormData,
): Promise<UpdateContactInfoState> {
  const { user, organizationId, role } = await requireOrgScope();

  const parsed = updateContactInfoSchema.safeParse({
    email: formData.get("email"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const { email, phone } = parsed.data;
  const emailChanged = email.toLowerCase() !== user.email.toLowerCase();
  const phoneChanged = phone !== (user.phone ?? "");

  if (emailChanged) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "That email is already in use by another account." };
    }
  }

  if (!emailChanged && !phoneChanged) {
    return { success: true };
  }

  await prisma.user.update({ where: { id: user.id }, data: { email, phone } });

  if (role === "RESIDENT") {
    const admins = await prisma.orgMembership.findMany({
      where: { organizationId, role: "ORG_ADMIN" },
      include: { user: true },
    });

    for (const admin of admins) {
      try {
        await sendContactInfoChangedEmail({
          to: admin.user.email,
          residentName: user.name,
          emailChange: emailChanged ? { from: user.email, to: email } : undefined,
          phoneChange: phoneChanged ? { from: user.phone, to: phone } : undefined,
        });
      } catch (err) {
        console.error("Failed to send contact-info-changed notification:", err);
      }
    }
  }

  revalidatePath("/dashboard/account");
  return { success: true };
}
