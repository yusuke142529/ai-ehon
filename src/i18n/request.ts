// src/i18n/request.ts

import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

export default getRequestConfig(async (context) => {
  // 明示的にawaitして文字列を取り出す
  const realLocale = await context.requestLocale;
  console.log('>>> [request.ts] requestLocale after await:', realLocale);

  let locale = realLocale;
  if (!locale || !routing.locales.includes(locale)) {
    locale = routing.defaultLocale;
    console.log(`>>> [request.ts] Invalid or missing locale, fallback to default: ${locale}`);
  }

  let messages: Record<string, any> = {};
  try {
    // 例: ../../messages/en.json or ../../messages/ja.json
    messages = (await import(`../../messages/${locale}.json`)).default;
    console.log(`>>> [request.ts] Successfully loaded messages for locale="${locale}"`);
    console.log('>>> [request.ts] hero.title =', messages.common?.hero?.title);
  } catch (err) {
    console.error(`>>> [request.ts] Failed to load messages for locale="${locale}":`, err);
  }

  return {
    locale,
    messages
  };
});