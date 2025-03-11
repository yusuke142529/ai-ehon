// src/app/api/ehon/[id]/comment/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const bookId = Number(params.id);
    if (isNaN(bookId)) {
      return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });
    }

    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    // Book の存在確認 (COMMUNITYのものにコメントする想定)
    const existingBook = await prisma.book.findUnique({
      where: { id: bookId },
    });
    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // コメント作成
    const newComment = await prisma.comment.create({
      data: {
        bookId,
        userId,
        text,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (err: unknown) {
    console.error("Error in POST /api/ehon/[id]/comment:", err);
    
    let errorMessage = "Internal Server Error";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Optional: GET メソッドでコメント一覧取得例
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookId = Number(params.id);
    if (isNaN(bookId)) {
      return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });
    }

    // コメントを新しい順に取得
    const comments = await prisma.comment.findMany({
      where: {
        bookId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      take: 50, // 先頭50件だけなど
    });

    return NextResponse.json(comments, { status: 200 });
  } catch (err: unknown) {
    console.error("Error in GET /api/ehon/[id]/comment:", err);
    
    let errorMessage = "Internal Server Error";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}