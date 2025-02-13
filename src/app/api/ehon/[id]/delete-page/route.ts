// src/app/api/ehon/[id]/delete-page/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * ページ削除
 * POST /api/ehon/[id]/delete-page
 * Body: { pageId: number }
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1) 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    // userId は string(UUID)
    const userId = session.user.id;

    // 2) 退会 or 存在チェック
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { deletedAt: true },
    });
    if (!user || user.deletedAt) {
      return NextResponse.json(
        { error: "Forbidden (user is deleted)" },
        { status: 403 }
      );
    }

    // 3) bookId
    const bookId = Number(params.id);
    if (Number.isNaN(bookId)) {
      return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });
    }

    // 4) body => pageId
    const { pageId } = (await req.json()) as { pageId?: number };
    if (!pageId) {
      return NextResponse.json(
        { error: "pageId is required" },
        { status: 400 }
      );
    }

    // 5) 該当ページかつ所有者チェック
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: {
        bookId: true,
        book: { select: { userId: true } },
      },
    });
    if (!page || page.bookId !== bookId) {
      return NextResponse.json(
        { error: "Page not found or mismatch bookId" },
        { status: 404 }
      );
    }
    if (page.book.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 6) 削除
    await prisma.page.delete({ where: { id: pageId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in deletePage route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}