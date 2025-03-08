// src/app/[locale]/ehon/[id]/viewer/page.tsx
import { prisma } from "@/lib/prismadb";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dynamic from "next/dynamic";

/**
 * ★ クライアントのみで描画するコンポーネントを動的インポート
 *    { ssr: false } が重要
 */
const BookViewerClient = dynamic(() => import("./BookViewerClient"), {
  ssr: false,
  // Optional: ロード中に表示するプレースホルダー
  loading: () => <div>Loading viewer...</div>,
});

interface BookViewerPageProps {
  params: { id: string; locale: string };
}

export default async function BookViewerPage({ params }: BookViewerPageProps) {
  // 1) Book ID チェック
  const bookId = Number(params.id);
  if (Number.isNaN(bookId)) {
    return notFound();
  }

  // 2) ログインユーザーID
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

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

  // ページのソートやお気に入り判定
  const sortedPages = [...book.pages].sort((a, b) => a.pageNumber - b.pageNumber);
  const isFavorite = userId
    ? !!book.likes.find((like) => like.userId === userId)
    : false;
  const isOwner = userId === book.userId;

  // 4) サーバーでは最低限のデータ取得のみ。実際のビューワー描画はクライアント側に任せる
  return (
    <BookViewerClient
      pages={sortedPages}
      bookTitle={book.title}
      bookId={book.id}
      artStyleId={book.artStyleId ?? undefined}
      theme={book.theme ?? undefined}
      genre={book.genre ?? undefined}
      characters={book.characters ?? undefined}
      targetAge={book.targetAge ?? undefined}
      pageCount={book.pageCount ?? undefined}
      createdAt={book.createdAt?.toISOString()}
      isFavorite={isFavorite}
      isSharedView={false}
      showEditButton={isOwner}
    />
  );
}
