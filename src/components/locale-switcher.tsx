"use client";

import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/lib/actions/locale";
import type { Locale } from "@/lib/i18n/get-dictionary";

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale || pending) return;
    startTransition(() => {
      setLocale(next, pathname);
    });
  }

  return (
    <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
      <button
        type="button"
        onClick={() => switchTo("en")}
        className={locale === "en" ? "text-slate-900 underline" : "hover:text-slate-700"}
      >
        EN
      </button>
      <span>/</span>
      <button
        type="button"
        onClick={() => switchTo("fr")}
        className={locale === "fr" ? "text-slate-900 underline" : "hover:text-slate-700"}
      >
        FR
      </button>
    </div>
  );
}
