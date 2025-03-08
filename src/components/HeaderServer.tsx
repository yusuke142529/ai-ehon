// src/components/HeaderServer.tsx

/**
 * ★ クライアントコンポーネントを埋め込む
 */
import HeaderClient from "./HeaderClient";

// もしサーバーサイドでセッションを取得する場合は、下記のように import が必要
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

type HeaderServerProps = {
  locale: string; // 必要に応じて他のpropsも
};

export default async function HeaderServer({ locale }: HeaderServerProps) {
  // SSR 側でユーザー情報を取得したい場合は、ここで getServerSession を実行
  // const session = await getServerSession(authOptions);

  return (
    <header>
      {/**
       * SSR時点で <header> タグを出力。
       * 中でクライアントコンポーネントをレンダリング => Hydration で差分なし
       */}
      <HeaderClient
        locale={locale}
        // serverSession={session}
        // ↑ サーバーで取ったセッションを子に渡すならpropsで渡す
      />
    </header>
  );
}