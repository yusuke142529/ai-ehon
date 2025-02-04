// src/app/api/ehon/[id]/apply-new-image/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { ensureActiveUser } from "@/lib/serverCheck";

/**
 * 再生成した画像を「採用」 (DBに反映)
 * POST /api/ehon/[id]/apply-new-image
 * Body: { pageId: number, newImageUrl: string }
 *
 * - PageImage の isAdopted = true にする
 * - 同時に page.imageUrl = newImageUrl に更新
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1) ログイン & 退会チェック
    const check = await ensureActiveUser();
    if (check.error) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }
    const userId = check.user.id;

    // 2) bookId
    const bookId = Number(params.id);
    if (Number.isNaN(bookId)) {
      return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });
    }

    // 3) body => pageId, newImageUrl
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

    // 4) ページを検索し、bookId一致＆所有者チェック
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

    // 5) PageImage レコードを探す
    const imageRecord = await prisma.pageImage.findFirst({
      where: { pageId, imageUrl: newImageUrl },
    });
    if (!imageRecord) {
      return NextResponse.json(
        { error: "No matching pageImage found" },
        { status: 404 }
      );
    }

    // 6) DB更新 (transaction):
    // - page.imageUrl = newImageUrl
    // - 既存 PageImage は isAdopted = false
    // - 今回のレコードだけ isAdopted = true
    await prisma.$transaction(async (tx) => {
      // (a) page の imageUrl を更新
      await tx.page.update({
        where: { id: pageId },
        data: { imageUrl: newImageUrl },
      });

      // (b) いったん全て isAdopted=false
      await tx.pageImage.updateMany({
        where: { pageId },
        data: { isAdopted: false },
      });

      // (c) 今回の画像だけ isAdopted=true
      await tx.pageImage.update({
        where: { id: imageRecord.id },
        data: { isAdopted: true },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in applyNewImage route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}