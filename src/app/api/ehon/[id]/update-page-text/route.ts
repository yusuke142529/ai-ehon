// src/app/api/ehon/[id]/update-page-text/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * ページ本文を更新
 * POST /api/ehon/[id]/update-page-text
 * Body: { pageId: number, text: string }
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
    // userId は string
    const userId = session.user.id;

    // 2) bookId (number)
    const bookId = Number(params.id);
    if (Number.isNaN(bookId)) {
      return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });
    }

    // 3) body => pageId, text
    const { pageId, text } = (await req.json()) as {
      pageId?: number;
      text?: string;
    };
    if (!pageId || typeof text !== "string") {
      return NextResponse.json(
        { error: "pageId and text are required" },
        { status: 400 }
      );
    }

    // 4) Page 所有権チェック
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

    // 5) ページ本文を更新
    await prisma.page.update({
      where: { id: pageId },
      data: { text },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in updatePageText route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}