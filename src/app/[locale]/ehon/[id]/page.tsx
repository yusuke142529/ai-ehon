// src/app/[locale]/ehon/[id]/page.tsx
import { prisma } from "@/lib/prismadb";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// クライアントコンポーネント
import EditBookClient from "./EditBookClient";

interface EhonDetailPageProps {
  params: { id: string }; // URLパラメータ (文字列)
}

export default async function EhonDetailPage({ params }: EhonDetailPageProps) {
  // 1) Book ID は数値 (autoincrement)
  const bookId = Number(params.id);
  if (Number.isNaN(bookId)) {
    return <div>無効なIDが指定されました</div>;
  }

  // 2) セッションでユーザーIDを取得 (string UUID)
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return <div>ログインしてください</div>;
  }
  const sessionUserId = session.user.id; // 文字列のまま

  // 3) Book + pages を取得 (bookId は number)
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      pages: true,
      user: true, // ユーザー情報も含める
    },
  });

  if (!book) {
    return notFound();
  }

  // 4) 所有者チェック
  //    Book.userId も string
  if (book.userId !== sessionUserId) {
    return <div>他のユーザーの絵本は編集できません</div>;
  }

  // 5) ページ順ソート
  const sortedPages = [...book.pages].sort((a, b) => a.pageNumber - b.pageNumber);

  // 6) クライアントコンポーネントにデータを渡す
  return (
    <EditBookClient
      book={{
        id: book.id,
        title: book.title || "無題の絵本",
        userName: book.user?.name || "",
        isPublished: book.isPublished,
        isCommunity: book.isCommunity, // 必要に応じて
      }}
      pages={sortedPages.map((p) => ({
        id: p.id,
        pageNumber: p.pageNumber,
        text: p.text || "",
        imageUrl: p.imageUrl || "",
        prompt: p.prompt || "",
      }))}
    />
  );
}