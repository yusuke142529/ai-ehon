// src/app/[locale]/mypage/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import MyPageClient from "./MyPageClient";

/**
 * MyPage (サーバーコンポーネント)
 * - 認証チェックのみを行い、ユーザーデータはクライアント側でSWRにより取得する
 */
export default async function MyPage({ params }: { params: { locale: string } }) {
  // 1) 認証チェック
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    redirect(`/${params.locale}/auth/login?callbackUrl=/${params.locale}/mypage`);
  }

  // ログイン済みならクライアントコンポーネントに移譲
  return <MyPageClient />;
}