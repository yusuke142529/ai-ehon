"use client";

import React from "react";
import { IntlProvider } from "next-intl";

/**
 * next-intl の IntlProvider をラップ。
 * locale / messages / timeZone 等を受け取って適用
 */
type AppProvidersProps = {
  children: React.ReactNode;
  locale?: string;
  messages?: Record<string, any>;
  timeZone?: string;
};

export default function AppProviders({
  children,
  locale = "en",
  messages = {},
  timeZone
}: AppProvidersProps) {
  return (
    <IntlProvider locale={locale} messages={messages} timeZone={timeZone}>
      {children}
    </IntlProvider>
  );
}