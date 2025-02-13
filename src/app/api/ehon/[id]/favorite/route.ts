export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/ehon/[id]/like
 * - いいね登録/解除
 */
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
    // userId は string
    const userId = session.user.id;

    // 2) bookId: number
    const bookId = parseInt(params.id, 10);
    if (Number.isNaN(bookId)) {
      return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });
    }

    // 3) Bookが存在するかチェック(必要なら)
    // const book = await prisma.book.findUnique({ ... })

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