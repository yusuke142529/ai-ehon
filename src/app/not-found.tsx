// src/app/not-found.tsx

import type { Metadata } from "next";
import Link from "next/link";

// 404ページ用のメタデータを設定
export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for could not be found.",
};

/**
 * シンプルな 404 ページ (サーバーコンポーネント)
 * - App Router では、存在しないURLにアクセスがあったとき、このコンポーネントが自動的に表示されます。
 */
export default function NotFound() {
  return (
    <main style={{ textAlign: "center", marginTop: "4rem" }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist or has been moved.</p>
      <p>
        <Link href="/">Go back Home</Link>
      </p>
    </main>
  );
}
