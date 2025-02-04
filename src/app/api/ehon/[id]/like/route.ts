// src/app/api/ehon/[id]/like/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1) ログインチェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    const userId = Number(session.user.id);

    // 2) bookId
    const bookId = parseInt(params.id, 10);
    if (Number.isNaN(bookId)) {
      return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });
    }

    // 3) Bookの公開状態を確認 (option)
    //    もし "未公開の絵本にいいね禁止" などの要件があれば。
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { isPublished: true, userId: true },
    });
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // * 例: 未公開にはいいねを付けられない、など
    // if (!book.isPublished && book.userId !== userId) {
    //   return NextResponse.json({ error: "This book is not published yet" }, { status: 403 });
    // }

    // 4) 既にLikeがあるか => 解除 or 登録
    const existing = await prisma.like.findUnique({
      where: {
        bookId_userId: {
          bookId,
          userId,
        },
      },
    });

    if (existing) {
      // いいね解除
      await prisma.like.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ ok: true, isFavorite: false });
    } else {
      // いいね登録
      await prisma.like.create({
        data: { bookId, userId },
      });
      return NextResponse.json({ ok: true, isFavorite: true });
    }
  } catch (err: any) {
    console.error("Error toggling favorite:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}