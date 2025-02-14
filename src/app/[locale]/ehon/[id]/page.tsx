// src/app/[locale]/ehon/[id]/page.tsx

import { prisma } from "@/lib/prismadb";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import EditBookClient from "./EditBookClient";

interface EhonDetailPageProps {
  params: { id: string };
}

export default async function EhonDetailPage({ params }: EhonDetailPageProps) {
  const bookId = Number(params.id);
  if (Number.isNaN(bookId)) {
    return <div>無効なIDが指定されました</div>;
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return <div>ログインしてください</div>;
  }
  const sessionUserId = session.user.id;

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      pages: true,
      user: true,
    },
  });

  if (!book) {
    return notFound();
  }

  if (book.userId !== sessionUserId) {
    return <div>他のユーザーの絵本は編集できません</div>;
  }

  const sortedPages = [...book.pages].sort((a, b) => a.pageNumber - b.pageNumber);

  return (
    <EditBookClient
      book={{
        id: book.id,
        title: book.title || "無題の絵本",
        userName: book.user?.name || "",
        isPublished: book.isPublished,
        /** 
         * Prisma スキーマには isCommunity がないので
         * communityAt が null でなければコミュニティ投稿と判定 
         */
        isCommunity: !!book.communityAt,
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
