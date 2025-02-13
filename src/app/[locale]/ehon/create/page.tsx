// app/[locale]/ehon/create/page.tsx

/** 例: 静的パラメータを生成する関数 */
export async function generateStaticParams() {
  // ここで対応する言語などを定義
  // 必要なパスを返す例（ja / en のみの場合）
  return [
    { locale: "ja" },
    { locale: "en" },
  ];
}

/** ここではクライアントコンポーネントを呼び出すだけにする */
import CreatePageClient from "./CreatePageClient";

export default function Page() {
  // サーバーコンポーネントなので、"use client" は書けない
  return <CreatePageClient />;
}