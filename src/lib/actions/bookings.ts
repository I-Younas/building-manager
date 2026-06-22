"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOrgScope, requireAdminOrStaff } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { bookingRequestSchema } from "@/lib/validation/facilities";

export type FormActionState = { error: string } | undefined;

function toMinutes(hhmm: string) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

async function hasOverlap(facilityId: string, startsAt: Date, endsAt: Date, excludeBookingId?: string) {
  const overlapping = await prisma.facilityBooking.findFirst({
    where: {
      facilityId,
      status: { in: ["PENDING", "APPROVED"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
  });
  return Boolean(overlapping);
}

export async function requestBooking(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const { user, organizationId } = await requireOrgScope();

  const parsed = bookingRequestSchema.safeParse({
    facilityId: formData.get("facilityId"),
    unitId: formData.get("unitId"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const facility = await prisma.facility.findFirst({
    where: { id: parsed.data.facilityId, organizationId, isActive: true },
  });
  if (!facility) {
    return { error: "Facility not found." };
  }

  const unitLink = await prisma.unitResident.findUnique({
    where: { unitId_userId: { unitId: parsed.data.unitId, userId: user.id } },
  });
  if (!unitLink) {
    return { error: "You can only book facilities for your own unit." };
  }

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    return { error: "Enter a valid start and end time." };
  }

  const durationMinutes = (endsAt.getTime() - startsAt.getTime()) / 60_000;
  if (durationMinutes > facility.maxDurationMinutes) {
    return { error: `Bookings for this facility can't exceed ${facility.maxDurationMinutes} minutes.` };
  }

  const minNoticeMs = facility.minNoticeHours * 60 * 60 * 1000;
  if (startsAt.getTime() < Date.now() + minNoticeMs) {
    return { error: `This facility requires at least ${facility.minNoticeHours} hour(s) notice.` };
  }

  const sameDay = startsAt.toDateString() === endsAt.toDateString();
  const startMinutes = startsAt.getHours() * 60 + startsAt.getMinutes();
  const endMinutes = endsAt.getHours() * 60 + endsAt.getMinutes();

  if (!sameDay || startMinutes < toMinutes(facility.openTime) || endMinutes > toMinutes(facility.closeTime)) {
    return {
      error: `This facility is only available between ${facility.openTime} and ${facility.closeTime}, same day.`,
    };
  }

  if (await hasOverlap(facility.id, startsAt, endsAt)) {
    return { error: "This time slot is already booked. Please choose another time." };
  }

  await prisma.facilityBooking.create({
    data: {
      organizationId,
      facilityId: facility.id,
      unitId: parsed.data.unitId,
      requestedById: user.id,
      startsAt,
      endsAt,
      status: facility.requiresApproval ? "PENDING" : "APPROVED",
    },
  });

  revalidatePath("/dashboard/facilities/bookings");
  redirect("/dashboard/facilities/bookings");
}

export async function decideBooking(
  bookingId: string,
  decision: "APPROVE" | "REJECT",
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const { user, organizationId } = await requireAdminOrStaff();

  const booking = await prisma.facilityBooking.findFirst({ where: { id: bookingId, organizationId } });
  if (!booking) {
    return { error: "Booking not found." };
  }
  if (booking.status !== "PENDING") {
    return { error: "This booking has already been decided." };
  }

  const note = String(formData.get("note") ?? "").trim().slice(0, 2000) || null;

  if (decision === "APPROVE") {
    if (await hasOverlap(booking.facilityId, booking.startsAt, booking.endsAt, booking.id)) {
      return {
        error: "This slot now overlaps with another approved booking. Reject it or ask for a new time.",
      };
    }
    await prisma.facilityBooking.update({
      where: { id: bookingId },
      data: { status: "APPROVED", approvedById: user.id, notes: note },
    });
  } else {
    await prisma.facilityBooking.update({
      where: { id: bookingId },
      data: { status: "REJECTED", approvedById: user.id, notes: note },
    });
  }

  revalidatePath("/dashboard/facilities/bookings");
}

export async function cancelBooking(bookingId: string) {
  const { user, organizationId, role } = await requireOrgScope();

  const booking = await prisma.facilityBooking.findFirst({ where: { id: bookingId, organizationId } });
  if (!booking) {
    throw new Error("Booking not found.");
  }
  if (role === "RESIDENT" && booking.requestedById !== user.id) {
    throw new Error("You can only cancel your own bookings.");
  }

  if (booking.status === "PENDING" || booking.status === "APPROVED") {
    await prisma.facilityBooking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });
  }

  revalidatePath("/dashboard/facilities/bookings");
}
