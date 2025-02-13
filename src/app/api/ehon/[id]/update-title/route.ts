// src/app/api/ehon/[id]/update-title/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * タイトル更新
 * POST /api/ehon/[id]/update-title
 * Body: { title: string }
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

    // 3) body => title
    const { title } = (await req.json()) as { title?: string };
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    // 4) 所有権チェック
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

    // 5) タイトル更新
    await prisma.book.update({
      where: { id: bookId },
      data: { title },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in updateTitle route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}