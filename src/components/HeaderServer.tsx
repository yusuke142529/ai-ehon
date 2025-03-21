// src/components/HeaderServer.tsx  (サーバーコンポーネント)
import HeaderClient from "./HeaderClient";

// もしサーバーサイドでセッションを取得する場合は、下記のように import が必要
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

type HeaderServerProps = {
  locale: string;
  hide?: boolean; // 追加: 非表示フラグ
};

export default async function HeaderServer({ locale, hide = false }: HeaderServerProps) {
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
        hide={hide}
        // serverSession={session}
        // ↑ サーバーで取ったセッションを子に渡すならpropsで渡す
      />
    </header>
  );
}