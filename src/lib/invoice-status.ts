// Derived, display-only status — the stored `status` field remains the
// source of truth for payment logic. We don't have a background job to
// flip ISSUED/PARTIALLY_PAID invoices to OVERDUE once dueDate passes, so
// this computes that label at render time instead.
export function getDisplayStatus(invoice: { status: string; dueDate: Date }): string {
  if (invoice.status !== "ISSUED" && invoice.status !== "PARTIALLY_PAID") {
    return invoice.status;
  }

  // dueDate comes from a date-only <input>, which parses as UTC midnight.
  // Compare against UTC midnight of "today" (not Date.now()) so an invoice
  // due today doesn't read as overdue before the day is even over.
  const now = new Date();
  const todayUtcMidnight = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  return invoice.dueDate.getTime() < todayUtcMidnight ? "OVERDUE" : invoice.status;
}
