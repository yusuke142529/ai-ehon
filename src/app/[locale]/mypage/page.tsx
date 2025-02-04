//src/app/[locale]/mypage/page.tsx

import { prisma } from "@/lib/prismadb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

import MyPageClient from "./MyPageClient"; // ←クライアントコンポーネントをimport

/**
 * MyPage (サーバーコンポーネント)
 * - 認証チェック
 * - DBからユーザー情報取得
 * - 取得データをクライアントコンポーネント (MyPageClient) に渡す
 */
export default async function MyPage({ params }: { params: { locale: string } }) {
  // 1) 認証チェック
  const session = await getServerSession(authOptions);
  if (!session) {
    // ログインしていない → ログインページへ
    redirect(`/${params.locale}/auth/login?callbackUrl=/${params.locale}/mypage`);
  }

  // session.user.id → number 変換
  const userId = Number(session.user.id);
  if (Number.isNaN(userId)) {
    redirect(`/${params.locale}/auth/login`);
  }

  // 2) DB からユーザー情報を取得
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      iconUrl: true,
      points: true,
    },
  });
  if (!user) {
    // 該当ユーザーがいなければトップへ or notFound()など
    redirect(`/${params.locale}`);
  }

  // 3) クライアントコンポーネントに渡す
  return <MyPageClient user={user} />;
}