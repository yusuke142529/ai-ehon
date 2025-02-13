// src/app/api/ehon/[id]/regenerate-page-image/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { generateStabilityUltraImage } from "@/services/stableDiffusionService";
import { uploadImageBufferToS3 } from "@/services/s3Service";
import { v4 as uuidv4 } from "uuid";
import { ensureActiveUser } from "@/lib/serverCheck";

/**
 * 画像再生成 (「同じプロンプトで再生成」)
 * POST /api/ehon/[id]/regenerate-page-image
 * Body: { pageId: number; baseImageUrl: string }
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
        { error: check.error || "Unauthorized" },
        { status: check.status || 401 }
      );
    }
    const userId = check.user.id;

    // 2) bookId & bodyパラメータの取得
    const bookId = Number(params.id);
    if (Number.isNaN(bookId)) {
      return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });
    }

    const { pageId, baseImageUrl } = (await req.json()) as {
      pageId?: number;
      baseImageUrl?: string;
    };
    if (!pageId || !baseImageUrl) {
      return NextResponse.json(
        { error: "pageId and baseImageUrl are required" },
        { status: 400 }
      );
    }

    // 3) Page検索 => 所有者チェック
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

    // 4) baseImageUrlに対応する PageImage を取得
    const baseImageRecord = await prisma.pageImage.findFirst({
      where: { pageId, imageUrl: baseImageUrl },
    });
    if (!baseImageRecord) {
      return NextResponse.json(
        { error: `No pageImage found with url=${baseImageUrl}` },
        { status: 404 }
      );
    }

    // 5) 旧promptを使用
    const finalPrompt = baseImageRecord.promptUsed;
    if (!finalPrompt) {
      return NextResponse.json(
        { error: "No promptUsed in baseImageRecord" },
        { status: 400 }
      );
    }

    // 6) ユーザーのポイントチェック (15pt消費)
    const REGENERATE_COST = 15;
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    if (!userRecord || userRecord.points < REGENERATE_COST) {
      return NextResponse.json(
        {
          error: "Not enough credits",
          required: REGENERATE_COST,
          current: userRecord?.points || 0,
        },
        { status: 400 }
      );
    }

    // 7) AI画像生成
    console.log(
      `[regeneratePageImage] => Generating with prompt:\n${finalPrompt}`
    );
    const generateRes = await generateStabilityUltraImage({
      prompt: finalPrompt,
      acceptMode: "image/*" as const,
      cfgScale: 7,
      steps: 30,
      seed: 0,
      sampler: "euler-a",
    });

    // 8) S3にアップロード
    const uniqueKey = `book_${bookId}_page_${pageId}_${Date.now()}_${uuidv4()}.png`;
    console.log("[regeneratePageImage] => Uploading to S3 as", uniqueKey);
    const newImageUrl = await uploadImageBufferToS3(
      generateRes.rawBuffer,
      uniqueKey,
      "image/png"
    );

    // 9) DBトランザクション => ポイント消費 & PageImage レコードの追加
    await prisma.$transaction(async (tx) => {
      // (a) ユーザーのポイント消費
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { points: { decrement: REGENERATE_COST } },
        select: { points: true },
      });
      if (updatedUser.points < 0) {
        throw new Error("Insufficient credits transaction error");
      }

      // (b) pointHistory 記録
      await tx.pointHistory.create({
        data: {
          userId,
          changeAmount: -REGENERATE_COST,
          reason: "regenerate_page",
          relatedId: pageId,
        },
      });

      // (c) 新しい PageImage レコードの追加
      await tx.pageImage.create({
        data: {
          pageId,
          imageUrl: newImageUrl,
          promptUsed: finalPrompt,
          isAdopted: false,
        },
      });
    });

    // 10) 成功レスポンス
    return NextResponse.json({ newImageUrl });
  } catch (error) {
    console.error("[regenerate-page-image] => Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}