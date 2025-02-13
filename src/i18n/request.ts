// src/i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async (params) => {
  // requestLocale は Promise<string | undefined>
  const resolvedLocale = await params.requestLocale;

  let locale = resolvedLocale ?? routing.defaultLocale;

  if (!routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  let messages: Record<string, any> = {};
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
    console.log(`[request.ts] Successfully loaded messages for locale="${locale}"`);
  } catch (err) {
    console.error(`[request.ts] Failed to load messages for locale="${locale}":`, err);
  }

  return {
    locale,
    messages,
  };
});