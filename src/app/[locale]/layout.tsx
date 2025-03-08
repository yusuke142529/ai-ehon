import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import RootProviders from "../RootProviders";
import AppProviders from "../providers";
import GoogleRecaptchaClientProvider from "@/components/GoogleRecaptchaClientProvider";

// サーバーコンポーネントで <header> / <footer> をSSR
import HeaderServer from "@/components/HeaderServer";
import FooterServer from "@/components/FooterServer";

// 没入モードのコンテキストを提供するクライアントコンポーネント
import LayoutClientWrapper from "./LayoutClientWrapper";

import { routing } from "@/i18n/routing";

// メタデータ（任意）
export const metadata = {
  title: "AI Ehon Maker",
  description: "GPT + DALL·E 3 for making picture books",
};

// 静的生成（SSG）用にロケール別パスを生成する場合
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
  // サポート外ロケールなら404を返す
  if (!routing.locales.includes(locale as "ja" | "en")) {
    notFound();
  }

  // next-intl で翻訳メッセージを取得
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {/* 
        下記は Chakra UI / next-auth / その他のプロバイダをラップ
        -> クライアントでも使えるようにする
      */}
      <RootProviders>
        <AppProviders locale={locale} messages={messages} timeZone="Asia/Tokyo">
          <GoogleRecaptchaClientProvider>
            {/**
             * ★ LayoutClientWrapper (クライアントコンポーネント) で全体を包む
             *    -> immersiveMode 等のコンテキストを下層の子が参照できる
             */}
            <LayoutClientWrapper>
              {/* サーバーコンポーネントで <header> / <footer> を出力 */}
              <HeaderServer locale={locale} />

              <main>{children}</main>

              <FooterServer locale={locale} />
            </LayoutClientWrapper>
          </GoogleRecaptchaClientProvider>
        </AppProviders>
      </RootProviders>
    </NextIntlClientProvider>
  );
}
