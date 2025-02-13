// src/app/api/ehon/[id]/comment/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  // 1) Book ID (number)
  const bookId = Number(params.id);
  if (Number.isNaN(bookId) || bookId <= 0) {
    return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });
  }

  // 2) 認証チェック: session.user.id (string) があるか
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id; // string

  // 3) リクエストボディ (text)
  const { text } = (await request.json()) as { text?: string };
  if (!text) {
    return NextResponse.json({ error: "コメント内容がありません" }, { status: 400 });
  }

  // 4) Book取得 => isCommunity
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { isCommunity: true },
  });
  if (!book) {
    return NextResponse.json({ error: "絵本が見つかりません" }, { status: 404 });
  }

  // 5) コミュニティ投稿されていない絵本ならコメント不可
  if (!book.isCommunity) {
    return NextResponse.json({ error: "コミュニティ未投稿の絵本にコメントできません" }, { status: 403 });
  }

  // 6) コメント作成 (userId: string, bookId: number)
  await prisma.comment.create({
    data: {
      userId,
      bookId,
      text,
    },
  });

  return NextResponse.json({ success: true });
}