// src/app/[locale]/ehon/[id]/viewer/page.tsx

import { prisma } from "@/lib/prismadb";
import { notFound } from "next/navigation";
import { Box, Text } from "@chakra-ui/react";
import BookViewerClient from "./BookViewerClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface Props {
  params: { id: string };
}

export default async function BookViewerPage({ params }: Props) {
  const bookId = Number(params.id);
  if (Number.isNaN(bookId)) {
    return notFound();
  }

  // ログインユーザーを取得
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : undefined;

  // 絵本データを取得
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      pages: true,
      likes: true, // お気に入り判定用
    },
  });

  // 該当絵本が存在しない場合
  if (!book) {
    return notFound();
  }

  // 完成チェック
  if (!book.isPublished) {
    return (
      <Box p={4}>
        <Text>この絵本はまだ完成していません。</Text>
      </Box>
    );
  }

  // ページを番号順にソート
  const sortedPages = [...book.pages].sort((a, b) => a.pageNumber - b.pageNumber);

  // お気に入り判定
  const isFavorite = userId
    ? !!book.likes.find((like) => like.userId === userId)
    : false;

  return (
    <Box w="100%" minH="100vh" bg="gray.50" m={0} p={0} overflowY="auto">
      <BookViewerClient
        pages={sortedPages}
        bookTitle={book.title}
        bookId={bookId}

        // 分割カラムをそのままフロントへ
        artStyleCategory={book.artStyleCategory ?? undefined}
        artStyleId={book.artStyleId ?? undefined}

        // 他のフィールド
        theme={book.theme}
        genre={book.genre}
        characters={book.characters}
        targetAge={book.targetAge}
        pageCount={book.pageCount}
        createdAt={book.createdAt?.toISOString()}
        isFavorite={isFavorite}
      />
    </Box>
  );
}