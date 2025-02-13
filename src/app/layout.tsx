// src/app/layout.tsx
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import "./globals.css";

export const metadata = {
  title: "AI Ehon Maker - Chakra Only",
  description: "GPT + DALL·E 3 for making picture books (Chakra UI only)",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // ミドルウェアや next-intl で設定した Cookie からロケールを取得（なければデフォルト "en"）
  const cookieStore = cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "en";

  return (
    <html lang={locale}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}