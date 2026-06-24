import "server-only";
import { cookies } from "next/headers";
import en from "./dictionaries/en.json";
import fr from "./dictionaries/fr.json";

export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_COOKIE_NAME = "locale";

export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, fr };

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return (LOCALES as readonly string[]).includes(value ?? "") ? (value as Locale) : "en";
}

export async function getDictionary(): Promise<Dictionary> {
  const locale = await getLocale();
  return dictionaries[locale];
}

export function formatMessage(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => values[key] ?? "");
}
