// src/app/api/ehon/[id]/apply-new-image/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { ensureActiveUser } from "@/lib/serverCheck";

/**
 * 再生成した画像を「採用」 (DBに反映)
 * POST /api/ehon/[id]/apply-new-image
 * Body: { pageId: number, newImageUrl: string }
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1) ログイン & 退会チェック
    const check = await ensureActiveUser();
    if (check.error || !check.user) {
      return NextResponse.json(
        { error: check.error || "User not found" },
        { status: check.status || 400 }
      );
    }
    const userId = check.user.id;

    // 2) bookId の取得
    const bookId = Number(params.id);
    if (Number.isNaN(bookId)) {
      return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });
    }

    // 3) リクエストボディから pageId, newImageUrl を取得
    const { pageId, newImageUrl } = (await req.json()) as {
      pageId?: number;
      newImageUrl?: string;
    };
    if (!pageId || !newImageUrl) {
      return NextResponse.json(
        { error: "pageId and newImageUrl are required" },
        { status: 400 }
      );
    }

    // 4) ページを検索し、bookId 一致＆所有者チェック
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

    // 5) 対象となる PageImage レコードを検索
    const imageRecord = await prisma.pageImage.findFirst({
      where: { pageId, imageUrl: newImageUrl },
    });
    if (!imageRecord) {
      return NextResponse.json(
        { error: "No matching pageImage found" },
        { status: 404 }
      );
    }

    // 6) トランザクション内で DB 更新
    await prisma.$transaction(async (tx) => {
      // (a) ページの imageUrl を更新
      await tx.page.update({
        where: { id: pageId },
        data: { imageUrl: newImageUrl },
      });

      // (b) すべての PageImage レコードの isAdopted を false に更新
      await tx.pageImage.updateMany({
        where: { pageId },
        data: { isAdopted: false },
      });

      // (c) 対象の PageImage レコードのみ isAdopted を true に更新
      await tx.pageImage.update({
        where: { id: imageRecord.id },
        data: { isAdopted: true },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error in applyNewImage route:", error);
    let message = "Internal Server Error";
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}