// src/i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import type { AbstractIntlMessages } from "next-intl";

export default getRequestConfig(async (params) => {
  // requestLocale は Promise<string | undefined>
  const resolvedLocale = await params.requestLocale;
  let locale = resolvedLocale ?? routing.defaultLocale;

  // routing.locales が [ 'en', 'ja', ... ] のような配列を想定
  if (!routing.locales.includes(locale)) {
    locale = routing.defaultLocale;
  }

  let messages: AbstractIntlMessages = {}; // 初期値は空オブジェクト(型: AbstractIntlMessages)

  try {
    // ここで実際の翻訳ファイルを読み込み
    // import した結果が “文字列 or ネストしたオブジェクト” のみならOK
    const imported = (await import(`../../messages/${locale}.json`)).default;

    // imported を AbstractIntlMessages として扱う
    // (翻訳ファイルが配列を含んでいなければ問題なく動作)
    messages = imported as AbstractIntlMessages;

    console.log(`[request.ts] Successfully loaded messages for locale="${locale}"`);
  } catch (err) {
    console.error(`[request.ts] Failed to load messages for locale="${locale}":`, err);
  }

  return {
    locale,
    messages,
  };
});