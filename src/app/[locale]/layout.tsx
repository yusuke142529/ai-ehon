// src/app/[locale]/layout.tsx
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { routing } from "@/i18n/routing";
import RootProviders from "../RootProviders";
import AppProviders from "../providers";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleRecaptchaClientProvider from "@/components/GoogleRecaptchaClientProvider";

/**
 * メタデータ (任意)
 */
export const metadata = {
  title: "AI Ehon Maker",
  description: "GPT + DALL·E 3 for making picture books",
};

/**
 * 静的生成用に全ロケールのパスを生成
 */
export function generateStaticParams() {
  return routing.locales.map((loc) => ({ locale: loc }));
}

/**
 * ロケール付きレイアウト（サーバーコンポーネント）
 */
export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  // サポート外のロケールなら404
  if (!routing.locales.includes(locale as "ja" | "en")) {
    notFound();
  }

  // SSG 用に現在のロケールをセット
  setRequestLocale(locale);

  // 翻訳メッセージは next-intl/server の getMessages() で取得
  const messages = await getMessages();

  return (
    <>
      <NextIntlClientProvider messages={messages}>
        <RootProviders>
          <AppProviders locale={locale} messages={messages} timeZone="Asia/Tokyo">
            <GoogleRecaptchaClientProvider>
              <Header />
              <main>{children}</main>
              <Footer />
            </GoogleRecaptchaClientProvider>
          </AppProviders>
        </RootProviders>
      </NextIntlClientProvider>
    </>
  );
}