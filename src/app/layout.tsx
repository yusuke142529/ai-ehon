//src/app/layout.tsx

import type { ReactNode } from "react";
// もしグローバルに使用するCSSがあれば "./globals.css" を読み込み。 
// (Tailwindなしであれば空ファイルにするか削除してもOK)
import "./globals.css"; 

export const metadata = {
  title: "AI Ehon Maker - Chakra Only",
  description: "GPT + DALL·E 3 for making picture books (Chakra UI only)",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}