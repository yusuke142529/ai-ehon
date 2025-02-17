//src/app/providers.tsx

"use client";

import React from "react";
import {IntlProvider, AbstractIntlMessages} from "next-intl";

/**
 * next-intl の IntlProvider をラップ。
 * locale / messages / timeZone 等を受け取って適用
 */
type AppProvidersProps = {
  children: React.ReactNode;
  locale?: string;
  // messages は AbstractIntlMessages 型
  messages?: AbstractIntlMessages;
  timeZone?: string;
};

export default function AppProviders({
  children,
  locale = "ja",
  messages,
  timeZone
}: AppProvidersProps) {
  // messages が undefined の場合は空オブジェクトを使う
  return (
    <IntlProvider
      locale={locale}
      messages={messages || {}}
      timeZone={timeZone}
    >
      {children}
    </IntlProvider>
  );
}