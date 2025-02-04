import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    // bookIdをNumberに変換
    const userId = Number(session.user.id);
    const bookId = parseInt(params.id, 10); // parseIntで数値化

    if (Number.isNaN(bookId)) {
      return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });
    }

    // 既にLikeが存在するかどうか
    const existing = await prisma.like.findUnique({
      where: {
        bookId_userId: {
          bookId,
          userId,
        },
      },
    });

    if (existing) {
      // すでにお気に入り => 解除 (削除)
      await prisma.like.delete({
        where: {
          id: existing.id,
        },
      });
      return NextResponse.json({ ok: true, isFavorite: false });
    } else {
      // まだお気に入りでない => 登録
      await prisma.like.create({
        data: {
          bookId,
          userId,
        },
      });
      return NextResponse.json({ ok: true, isFavorite: true });
    }
  } catch (err: any) {
    console.error("Error toggling favorite:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}