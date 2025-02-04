//src/app/[locale]/layout.tsx

import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import request from "@/i18n/request"; // ← プラグイン方式でなく request.ts を使う
import RootProviders from "../RootProviders";
import AppProviders from "../providers";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleRecaptchaClientProvider from "@/components/GoogleRecaptchaClientProvider";

/**
 * メタデータなど
 */
export const metadata = {
  title: "AI Ehon Maker",
  description: "GPT + DALL·E 3 for making picture books",
};

/**
 * SSG 用に全ロケールの静的パスを生成
 */
export function generateStaticParams() {
  // サポートするロケールを列挙 (['ja','en'] etc.)
  return routing.locales.map((loc) => ({ locale: loc }));
}

/**
 * ルートレイアウト: /[locale]/...
 * middleware.ts が '/ja' or '/en' へリダイレクトしてくれた後の処理
 */
export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  // 1) 不明ロケールなら 404
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  // 2) 静的レンダリング (SSG) を有効にする場合は setRequestLocale() を呼ぶ
  //    -> Next.js がビルド時にこの locale を使い、SSR/SSG が動く
  setRequestLocale(locale);

  // 3) request.ts で定義した getRequestConfig の結果を取得
  //    => 翻訳メッセージファイル (ja.json / en.json 等) を非同期ロード
  const { messages } = await request({
    requestLocale: locale
  });

  // 4) あとは各種 Provider でラップ
  return (
    <RootProviders>
      <AppProviders locale={locale} messages={messages} timeZone="Asia/Tokyo">
        <GoogleRecaptchaClientProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </GoogleRecaptchaClientProvider>
      </AppProviders>
    </RootProviders>
  );
}