import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { routing } from "@/i18n/routing";
import RootProviders from "../root-providers";  // SSRセッションを注入するラッパ
import LayoutClientWrapper from "./LayoutClientWrapper";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: "AI Ehon Maker",
  description: "GPT + DALL·E 3 for making picture books",
};

export function generateStaticParams() {
  return routing.locales.map((loc) => ({ locale: loc }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  // ロケール判定
  if (!routing.locales.includes(locale as "ja" | "en")) {
    notFound();
  }

  // next-intl でリクエストロケールを設定
  setRequestLocale(locale);
  const messages = await getMessages();

  // Step2: SSRでセッション取得 → RootProviders に注入
  const session = await getServerSession(authOptions);

  return (
    <NextIntlClientProvider messages={messages}>
      <RootProviders session={session}>
        <main>
          <LayoutClientWrapper locale={locale}>
            {children}
          </LayoutClientWrapper>
        </main>
      </RootProviders>
    </NextIntlClientProvider>
  );
}
