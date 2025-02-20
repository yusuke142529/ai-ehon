import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import type { AbstractIntlMessages } from "next-intl";

//
// 1) "ja" | "en" の型を定義
//
type RoutingLocale = typeof routing.locales[number];
// => "ja" | "en"

//
// 2) タイプガード関数を定義
//
function isRoutingLocale(str: string): str is RoutingLocale {
  // includes の引数にもキャストが必要
  return routing.locales.includes(str as RoutingLocale);
}

export default getRequestConfig(async (params) => {
  // requestLocale は Promise<string | undefined>
  const resolvedLocale = await params.requestLocale;
  let locale = resolvedLocale ?? routing.defaultLocale; 
  // ↑ ここでは locale は string 型

  //
  // 3) "ja" | "en" のいずれかでなければ defaultLocale にフォールバック
  //
  if (!isRoutingLocale(locale)) {
    locale = routing.defaultLocale;
  }
  // ここで locale は "ja" | "en" のみ

  let messages: AbstractIntlMessages = {}; // 初期値は空オブジェクト

  try {
    // locale はここで "ja" | "en" と確定
    const imported = (await import(`../../messages/${locale}.json`)).default;
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