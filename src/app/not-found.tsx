"use client";

import React from "react";
import { NextIntlClientProvider } from "next-intl";
// ロケールファイル (パスをあわせて下さい)
import jaMessages from "../../messages/ja.json";
import enMessages from "../../messages/en.json";

// URL (pathname) からロケールを推定するなど
function detectLocale(): "ja" | "en" {
  if (typeof window !== "undefined") {
    const path = window.location.pathname; // 例: "/ja", "/en", ...
    if (path.startsWith("/ja")) return "ja";
  }
  return "en";
}

export default function NotFoundPage() {
  // useLocale() は使わず、手動で locale を判定
  const locale = detectLocale();
  const messages = locale === "ja" ? jaMessages : enMessages;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div style={{ textAlign: "center", marginTop: "4rem" }}>
        <h1>
          404 - {locale === "ja" ? "ページが見つかりません" : "Page Not Found"}
        </h1>
        <p>
          <a href={`/${locale}`}>Go back Home</a>
        </p>
      </div>
    </NextIntlClientProvider>
  );
}