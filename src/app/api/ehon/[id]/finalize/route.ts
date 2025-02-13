// src/app/api/ehon/[id]/finalize/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { ensureActiveUser } from "@/lib/serverCheck";

/**
 * POST /api/ehon/[id]/finalize
 * 絵本を完成状態 (isPublished=true) にし、publishedAt をセット
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1) ログイン & 退会チェック
    const check = await ensureActiveUser();
    if (check.error || !check.user) {
      return NextResponse.json(
        { error: check.error || "Unauthorized" },
        { status: check.status || 401 }
      );
    }
    const userId = check.user.id;

    // 2) bookIdを取得
    const bookId = Number(params.id);
    if (Number.isNaN(bookId)) {
      return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });
    }

    // 3) Book検索 & 所有者チェック
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { userId: true },
    });
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    if (book.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4) isPublished=true, publishedAt を更新
    await prisma.book.update({
      where: { id: bookId },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error finalizing book:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}