import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const bookId = Number(params.id);
  if (!bookId) {
    return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });
  }

  // 認証チェック
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = Number(session.user.id);

  const { text } = await request.json() as { text?: string };
  if (!text) {
    return NextResponse.json({ error: "コメント内容がありません" }, { status: 400 });
  }

  // Bookを取得 => isCommunityチェック
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { isCommunity: true },
  });
  if (!book) {
    return NextResponse.json({ error: "絵本が見つかりません" }, { status: 404 });
  }

  // コミュニティ投稿されていない絵本 => コメント不可
  if (!book.isCommunity) {
    return NextResponse.json({ error: "コミュニティ未投稿の絵本にコメントできません" }, { status: 403 });
  }

  // コメント作成
  await prisma.comment.create({
    data: { userId, bookId, text },
  });

  return NextResponse.json({ success: true });
}