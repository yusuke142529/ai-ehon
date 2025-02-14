// src/app/api/ehon/[id]/refine-and-regenerate-page-image/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { v4 as uuidv4 } from "uuid";

import { getOpenAI } from "@/services/openaiClient";
import { generateStabilityUltraImage } from "@/services/stableDiffusionService";
import { uploadImageBufferToS3 } from "@/services/s3Service";
import { stylePrompts } from "@/constants/stylePrompts"; // stylePrompts は単一配列
import { ensureActiveUser } from "@/lib/serverCheck";

/**
 * POST /api/ehon/[id]/refine-and-regenerate-page-image
 * Body: { pageId: number; baseImageUrl: string; feedback: string }
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

    // 2) bookId & bodyパラメータ
    const bookId = Number(params.id);
    if (Number.isNaN(bookId)) {
      return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });
    }

    const { pageId, baseImageUrl, feedback } = (await req.json()) as {
      pageId?: number;
      baseImageUrl?: string;
      feedback?: string;
    };

    if (!pageId) {
      return NextResponse.json({ error: "pageId is required" }, { status: 400 });
    }
    if (!baseImageUrl) {
      return NextResponse.json(
        { error: "baseImageUrl is required" },
        { status: 400 }
      );
    }
    if (!feedback || !feedback.trim()) {
      return NextResponse.json(
        { error: "feedback is empty" },
        { status: 400 }
      );
    }

    // 3) ページの存在＆所有者チェック
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: {
        bookId: true,
        book: {
          select: {
            userId: true,
            artStyleId: true,
          },
        },
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

    // 4) baseImageUrl から旧プロンプトを取得
    const baseImageRecord = await prisma.pageImage.findFirst({
      where: { pageId, imageUrl: baseImageUrl },
    });
    if (!baseImageRecord) {
      return NextResponse.json(
        { error: `No pageImage found with url=${baseImageUrl}` },
        { status: 404 }
      );
    }
    const oldPrompt = baseImageRecord.promptUsed;
    if (!oldPrompt) {
      return NextResponse.json(
        { error: "No old prompt found in baseImageRecord" },
        { status: 400 }
      );
    }

    // 5) ユーザーポイント確認 (15pt消費)
    const REGENERATE_COST = 15;
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (userRecord.points < REGENERATE_COST) {
      return NextResponse.json(
        {
          error: "Not enough credits",
          required: REGENERATE_COST,
          current: userRecord.points,
        },
        { status: 400 }
      );
    }

    // 6) GPT-4で新しい場面プロンプトの作成
    console.log("[refineAndRegenerate] => GPT refining with feedback:", feedback);
    const openai = await getOpenAI();
    if (!openai) {
      throw new Error("No OpenAI client. Check OPENAI_API_KEY.");
    }

    const systemMessage = `
You are an AI assistant that refines a short English scene prompt for a children's picture book.
Your output MUST be around 55-60 tokens in English, focusing on visible details only.
No mention of art style or internal emotions.
`.trim();

    const userMessage = `
The previous scene prompt was:
"${oldPrompt}"

The user complains or wants changes:
"${feedback}"

Please provide a revised English scene prompt that reflects the user's concern.
It must be around 55-60 tokens, describing only visible details, and do NOT mention art style.
Do not exceed 60 tokens.
`.trim();

    const gptResp = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });
    const newScenePrompt = gptResp.choices[0]?.message?.content?.trim() || "";
    console.log("[DEBUG] => GPT newScenePrompt =", newScenePrompt);

    // 7) アートスタイルプロンプトを合体
    const { artStyleId: bookArtStyleId } = page.book;
    let stylePrompt = "";
    if (bookArtStyleId) {
      const found = stylePrompts.find((x) => x.id === bookArtStyleId);
      if (found) {
        stylePrompt = found.prompt;
      }
    }
    const finalPrompt = [newScenePrompt, stylePrompt]
      .map((s) => s.trim())
      .filter(Boolean)
      .join("\n");
    console.log("[DEBUG] => finalPrompt:\n", finalPrompt);

    // 8) 画像生成
    const stableParams = {
      prompt: finalPrompt,
      acceptMode: "image/*" as const,
      cfgScale: 9,
      steps: 30,
      seed: 0,
      sampler: "dpmpp_2s_a_karras",
    } as const;
    console.log("[DEBUG] => stableDiff params:", stableParams);
    const generateRes = await generateStabilityUltraImage(stableParams);

    // 9) S3アップロード
    const uniqueKey = `book_${bookId}_page_${pageId}_${Date.now()}_${uuidv4()}.png`;
    console.log("[DEBUG] => Uploading to S3 with key:", uniqueKey);
    const newImageUrl = await uploadImageBufferToS3(
      generateRes.rawBuffer,
      uniqueKey,
      "image/png"
    );
    console.log("[DEBUG] => newImageUrl:", newImageUrl);

    // 10) DBトランザクション => ポイント消費 & pointHistory 記録 & PageImage レコードの追加
    await prisma.$transaction(async (tx) => {
      // (a) ユーザーのポイント消費
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { points: { decrement: REGENERATE_COST } },
        select: { points: true },
      });
      if (updatedUser.points < 0) {
        throw new Error("Insufficient points transaction error");
      }

      // (b) pointHistory 記録
      await tx.pointHistory.create({
        data: {
          userId,
          changeAmount: -REGENERATE_COST,
          reason: "refine_and_regenerate_nochar",
          relatedId: pageId,
        },
      });

      // (c) PageImage レコードの追加
      await tx.pageImage.create({
        data: {
          pageId,
          imageUrl: newImageUrl,
          promptUsed: finalPrompt,
          isAdopted: false,
        },
      });
    });

    // 11) 成功レスポンス
    return NextResponse.json({
      message: "Refined scene & regenerated image with style successfully",
      newImageUrl,
      newScenePrompt,
    });
  } catch (error: unknown) {
    console.error("[refineAndRegenerate] => Error:", error);

    // デフォルトのエラーメッセージ
    let message = "Internal Server Error";
    if (error instanceof Error) {
      message = error.message;
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}