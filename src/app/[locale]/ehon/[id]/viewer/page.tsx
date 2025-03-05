// src/app/[locale]/ehon/[id]/viewer/page.tsx

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prismadb";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Import our fixed client component directly
import BookViewerClient from "./BookViewerClient";

interface BookViewerPageProps {
  params: { id: string; locale: string };
}

export default async function BookViewerPage({ params }: BookViewerPageProps) {
  // 1) Book.id は数値
  const bookId = Number(params.id);
  if (Number.isNaN(bookId)) {
    return notFound();
  }

  // 2) ログインユーザー取得 (ユーザーIDは string)
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? undefined; // string or undefined

  // 3) DB問い合わせ
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      pages: true,
      likes: true,
    },
  });

  if (!book) {
    return notFound();
  }

  // 4) ページソート
  const sortedPages = [...book.pages].sort((a, b) => a.pageNumber - b.pageNumber);

  // 5) お気に入り判定 (Like.userId は string)
  const isFavorite = userId
    ? !!book.likes.find((like) => like.userId === userId)
    : false;
    
  // 6) 所有者チェック: ユーザーIDと本の所有者IDが一致するかを確認
  const isOwner = userId === book.userId;

  // 7) 直接クライアントコンポーネントに渡す
  return (
    <BookViewerClient
      pages={sortedPages}
      bookTitle={book.title}
      bookId={bookId}
      artStyleId={book.artStyleId ?? undefined}
      theme={book.theme ?? undefined}
      genre={book.genre ?? undefined}
      characters={book.characters ?? undefined}
      targetAge={book.targetAge ?? undefined}
      pageCount={book.pageCount ?? undefined}
      createdAt={book.createdAt?.toISOString()}
      isFavorite={isFavorite}
      isSharedView={false}
      showEditButton={isOwner} // 所有者の場合のみ true
    />
  );
}