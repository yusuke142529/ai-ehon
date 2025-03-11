export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prismadb";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1) 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // 2) bookId パラメータ取得
    const bookId = Number(params.id);
    if (Number.isNaN(bookId)) {
      return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });
    }

    // 3) 既にいいね済みかどうか
    const existing = await prisma.like.findUnique({
      where: {
        bookId_userId: { bookId, userId },
      },
    });

    if (existing) {
      // 4) 取り消し
      await prisma.like.delete({
        where: {
          bookId_userId: { bookId, userId },
        },
      });
      // フロントで "isLiked: false" を受け取る → 「取り消し」扱い
      return NextResponse.json({ isLiked: false });
    } else {
      // 5) 新規にいいね
      await prisma.like.create({
        data: {
          bookId,
          userId,
        },
      });
      // フロントで "isLiked: true" を受け取る → 「いいね」扱い
      return NextResponse.json({ isLiked: true });
    }
  } catch (err) {
    console.error("Error in POST /api/ehon/[id]/like:", err);

    let errorMessage = "Internal Server Error";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
