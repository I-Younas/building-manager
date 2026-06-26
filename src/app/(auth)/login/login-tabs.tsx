"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, residentLogin, staffLogin } from "@/lib/actions/auth";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { Button, ErrorText, formStackClasses, inputClasses, labelClasses } from "@/components/ui";

export type LoginRole = "ORG_ADMIN" | "RESIDENT" | "STAFF";

const TAB_KEY: Record<LoginRole, "orgAdmin" | "resident" | "staff"> = {
  ORG_ADMIN: "orgAdmin",
  RESIDENT: "resident",
  STAFF: "staff",
};

const ROLES: LoginRole[] = ["ORG_ADMIN", "RESIDENT", "STAFF"];

export function LoginTabs({ initialRole, dict }: { initialRole: LoginRole; dict: Dictionary["auth"]["login"] }) {
  const [role, setRole] = useState<LoginRole>(initialRole);
  const [adminState, adminAction, adminPending] = useActionState(login, undefined);
  const [residentState, residentAction, residentPending] = useActionState(residentLogin, undefined);
  const [staffState, staffAction, staffPending] = useActionState(staffLogin, undefined);

  function selectRole(next: LoginRole) {
    setRole(next);
    document.cookie = `lastLoginRole=${next}; path=/; max-age=31536000`;
  }

  return (
    <div className={formStackClasses}>
      <h1 className="text-xl font-semibold text-slate-900">{dict.title}</h1>

      <div className="grid grid-cols-3 gap-1 rounded-md bg-slate-100 p-1">
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => selectRole(r)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              role === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {dict.tabs[TAB_KEY[r]]}
          </button>
        ))}
      </div>

      {role === "ORG_ADMIN" ? (
        <form action={adminAction} className={formStackClasses}>
          <label className={labelClasses}>
            {dict.email}
            <input name="email" type="email" required className={inputClasses} />
          </label>
          <label className={labelClasses}>
            {dict.password}
            <input name="password" type="password" required className={inputClasses} />
          </label>
          <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline">
            {dict.forgotPassword}
          </Link>

          {adminState?.error ? <ErrorText>{adminState.error}</ErrorText> : null}

          <Button type="submit" disabled={adminPending}>
            {adminPending ? dict.loggingIn : dict.logIn}
          </Button>

          <p className="text-sm text-slate-500">
            {dict.signUpPrompt}{" "}
            <Link href="/signup" className="font-medium text-blue-600 hover:underline">
              {dict.signUpLink}
            </Link>
          </p>
        </form>
      ) : null}

      {role === "RESIDENT" ? (
        <form action={residentAction} className={formStackClasses}>
          <label className={labelClasses}>
            {dict.email}
            <input name="email" type="email" required className={inputClasses} />
          </label>
          <label className={labelClasses}>
            {dict.password}
            <input name="password" type="password" required className={inputClasses} />
          </label>
          <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline">
            {dict.forgotPassword}
          </Link>

          {residentState?.error ? <ErrorText>{residentState.error}</ErrorText> : null}

          <Button type="submit" disabled={residentPending}>
            {residentPending ? dict.loggingIn : dict.logIn}
          </Button>
        </form>
      ) : null}

      {role === "STAFF" ? (
        <form action={staffAction} className={formStackClasses}>
          <label className={labelClasses}>
            {dict.email}
            <input name="email" type="email" required className={inputClasses} />
          </label>
          <label className={labelClasses}>
            {dict.password}
            <input name="password" type="password" required className={inputClasses} />
          </label>
          <label className={labelClasses}>
            {dict.employeeId}
            <input name="employeeId" required className={inputClasses} />
          </label>
          <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline">
            {dict.forgotPassword}
          </Link>

          {staffState?.error ? <ErrorText>{staffState.error}</ErrorText> : null}

          <Button type="submit" disabled={staffPending}>
            {staffPending ? dict.loggingIn : dict.logIn}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
