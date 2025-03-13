import type { ReactNode } from "react";
import { cookies } from "next/headers";
import "./globals.css";

// next/font で Google Fonts を読み込む
import { Kosugi_Maru } from "next/font/google";

// Chakra UI ColorModeScript (theme は importしない)
import { ColorModeScript } from "@chakra-ui/react";

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
    <html
      lang={locale}
      data-theme="light"                // ★ 追加
      style={{ colorScheme: "light" }}  // ★ 追加
    >
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body suppressHydrationWarning className={kosugiMaru.className}>
        {/*
          初期カラーモードを"light"に指定
          (ここでtheme.tsをimportしない)
        */}
        <ColorModeScript initialColorMode="light" />
        {children}
      </body>
    </html>
  );
}
