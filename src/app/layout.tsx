// src/app/layout.tsx
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import "./globals.css";

// next/font で Google Fonts を読み込む
import { Kosugi_Maru } from "next/font/google";

// フォントを定義
const kosugiMaru = Kosugi_Maru({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "AI Ehon Maker - Chakra Only",
  description: "GPT + DALL·E 3 for making picture books (Chakra UI only)",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // ミドルウェアや next-intl で設定した Cookie からロケールを取得（なければ "en"）
  const cookieStore = cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "en";

  return (
    <html lang={locale}>
      {/* head タグ内でフォント読み込みリンクを削除し、next/font に任せる */}
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      {/* body にフォントクラスを適用 */}
      <body suppressHydrationWarning className={kosugiMaru.className}>
        {children}
      </body>
    </html>
  );
}
