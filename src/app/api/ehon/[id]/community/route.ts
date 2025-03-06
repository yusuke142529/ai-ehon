export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";

/**
 * GET /api/ehon/[id]/community
 *  指定した絵本 (id) を取得 (コミュニティ公開されているかどうかは任意)
 *  pages, user, comments, _count などを include
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const bookId = Number(params.id);
  if (!bookId) {
    return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });
  }

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      // ページ番号順にソート
      pages: {
        orderBy: { pageNumber: "asc" },
      },
      user: true,
      comments: {
        include: {
          user: true,
        },
      },
      // いいね数・コメント数
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  return NextResponse.json(book, { status: 200 });
}

/**
 * POST /api/ehon/[id]/community
 *  絵本をコミュニティに投稿 (isPublished = true, isCommunity = true, etc.)
 *  更新後の絵本データを同じく include 付きで返す
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const bookId = Number(params.id);
  if (!bookId) {
    return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });
  }

  // TODO: 認証ユーザーが book.userId と一致するかチェック

  // 絵本をコミュニティに投稿
  await prisma.book.update({
    where: { id: bookId },
    data: {
      isPublished: true,
      publishedAt: new Date(),
      isCommunity: true,
      communityAt: new Date(),
    },
  });

  // 更新後の絵本を再取得 (pages や user, comments を含めて)
  const updatedBook = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      pages: {
        orderBy: { pageNumber: "asc" },
      },
      user: true,
      comments: {
        include: {
          user: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  if (!updatedBook) {
    return NextResponse.json({ error: "Book not found after update" }, { status: 404 });
  }

  // 更新後の絵本を返す
  return NextResponse.json(updatedBook, { status: 200 });
}
