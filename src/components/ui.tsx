import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const BUTTON_VARIANTS: Record<Variant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-blue-500",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
  ghost: "text-slate-600 hover:bg-slate-100 focus-visible:ring-blue-500",
};

const BUTTON_SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md") {
  return `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button className={`${buttonClasses(variant, size)} ${className}`} {...props} />;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className = "",
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; size?: Size; href: string }) {
  return <Link href={href} className={`${buttonClasses(variant, size)} ${className}`} {...props} />;
}

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  info: "bg-sky-100 text-sky-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-700",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}

const STATUS_TONES: Record<string, Tone> = {
  RESOLVED: "success",
  CLOSED: "success",
  APPROVED: "success",
  PAID: "success",
  CHECKED_OUT: "success",
  ACTIVE: "success",
  RENEWED: "success",
  IN_PROGRESS: "info",
  ISSUED: "info",
  CHECKED_IN: "info",
  PARTIALLY_PAID: "info",
  MEDIUM: "info",
  RENEWAL_IN_PROGRESS: "info",
  OPEN: "warning",
  PENDING: "warning",
  EXPECTED: "warning",
  ON_HOLD: "warning",
  DRAFT: "warning",
  EXPIRING_SOON: "warning",
  PENDING_DECISION: "warning",
  LOW: "neutral",
  OVERDUE: "danger",
  REJECTED: "danger",
  CANCELLED: "danger",
  VOID: "danger",
  NO_SHOW: "danger",
  URGENT: "danger",
  HIGH: "danger",
  EXPIRED: "danger",
  NOT_RENEWING: "danger",
};

export function statusTone(status: string): Tone {
  return STATUS_TONES[status] ?? "neutral";
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{status.replace(/_/g, " ")}</Badge>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-slate-200 bg-white p-6 shadow-sm ${className}`}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
      {children}
    </p>
  );
}

export const labelClasses = "block text-sm font-medium text-slate-700";
export const inputClasses =
  "mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
export const checkboxClasses = "h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500";
export const formStackClasses = "flex flex-col gap-4";

export const tableWrapClasses = "overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm";
export const tableClasses = "min-w-full divide-y divide-slate-200 text-sm";
export const theadClasses = "bg-slate-50";
export const thClasses = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";
export const tdClasses = "px-4 py-3 align-top text-slate-700";
export const trClasses = "hover:bg-slate-50";
