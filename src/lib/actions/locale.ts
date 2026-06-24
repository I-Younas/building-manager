"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE_NAME, LOCALES, type Locale } from "@/lib/i18n/get-dictionary";

export async function setLocale(locale: Locale, path: string) {
  if (!LOCALES.includes(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, locale, { maxAge: 60 * 60 * 24 * 365, path: "/" });

  revalidatePath(path);
}
