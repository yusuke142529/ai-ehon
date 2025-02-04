//src/app/api/ehon/generate/route.ts

"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { ensureActiveUser } from "@/lib/serverCheck"; // ★追加

import { buildFullStory } from "@/services/buildFullStory";
import { refineStoryFormat } from "@/services/refineStoryFormat";
import { buildScenePromptsForBook } from "@/services/buildScenePromptsForBook";
import { generateAllImagesStabilityUltra } from "@/services/stableDiffAllService";

import { characterPrompts } from "@/constants/characterPrompts";
import { stylePrompts } from "@/constants/stylePrompts";

/**
 * POST /api/ehon/generate
 * Body: { pageCount, theme, genre, charAnimal, artStyle, ageRange, language }
 */
export async function POST(req: Request) {
  try {
    console.log("[/api/ehon/generate] => called");
    // 1) ログイン＆退会チェック
    const check = await ensureActiveUser();
    if (check.error) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }
    const userId = check.user.id;

    // 2) 入力データ取得
    const data = await req.json();
    console.log("[/api/ehon/generate] => user selection:", data);

    const {
      pageCount,
      theme,
      genre,
      charAnimal,
      artStyle,
      ageRange,
      language,
    } = data;

    // (A) ポイント計算
    const costPerPage = 15;
    const creditsNeeded = pageCount * costPerPage;

    // 3) DBユーザー => points
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    if (!user) {
      console.error("User not found:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 4) クレジット不足チェック
    if (user.points < creditsNeeded) {
      console.error("Not enough credits:", user.points, "required:", creditsNeeded);
      return NextResponse.json({
        error: "Not enough credits",
        required: creditsNeeded,
        current: user.points,
      }, { status: 400 });
    }

    // 5) キャラクタープロンプト / スタイルプロンプト
    let charPrompt = "";
    if (charAnimal && characterPrompts[charAnimal]) {
      charPrompt = characterPrompts[charAnimal].basic;
    }

    let stylePrompt = "";
    if (artStyle?.category && typeof artStyle.styleId === "number") {
      const cat = artStyle.category;
      const styleId = artStyle.styleId;
      const arr = stylePrompts[cat];
      if (arr) {
        const found = arr.find((x) => x.id === styleId);
        if (found) {
          stylePrompt = found.prompt.trim();
        }
      }
    }

    // 6) 物語構築
    console.log("[buildFullStory] => building story...");
    const { title, pages: roughPages } = await buildFullStory({
      pageCount,
      theme,
      genre,
      ageRange,
      mainCharacter: { species: charAnimal },
      language,
    });
    console.log("[LOG] => rough story:", { title, roughPages });

    // 7) JSON形式でストーリー整形
    const { title: refinedTitle, pages: finalPages } = await refineStoryFormat({
      originalLines: roughPages,
      pageCount,
    });
    console.log("[LOG] => refined lines:", { title: refinedTitle, pages: finalPages });

    // 8) 表紙 + ページ用プロンプト生成
    const coverFullText = finalPages.join("\n\n");
    const scenePromptsAll = await buildScenePromptsForBook({
      pageCount,
      storyTexts: finalPages,
      coverStoryText: coverFullText,
    });
    console.log("[scenePromptsAll]", scenePromptsAll);

    // 9) 画像生成
    console.log("[generateAllImagesStabilityUltra] => Start image generation.");
    const pageResults = await generateAllImagesStabilityUltra({
      characterPrompt: charPrompt,
      scenePrompts: scenePromptsAll,
      stylePrompt,
    });
    console.log("[LOG] => pageResults:", pageResults);

    // 10) DBトランザクション => points減算 + Book/Page/PageImage
    const createdBook = await prisma.$transaction(async (tx) => {
      // (a) user.pointsを減算
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { points: { decrement: creditsNeeded } },
        select: { points: true },
      });
      if (updatedUser.points < 0) {
        throw new Error("Insufficient credits transaction error");
      }

      // (b) Book作成 + Pages作成
      const newBook = await tx.book.create({
        data: {
          userId,
          title: refinedTitle,
          theme,
          genre,
          characters: charAnimal,
          artStyleCategory: artStyle?.category || undefined,
          artStyleId: artStyle?.styleId || undefined,
          targetAge: ageRange,
          pageCount,
          pages: {
            create: pageResults.map((res, idx) => {
              // idx=0 => カバー
              if (idx === 0) {
                return {
                  pageNumber: 0,
                  text: "(cover)",
                  prompt: res.finalPrompt,
                  imageUrl: res.imageUrl,
                };
              } else {
                // idx=1..pageCount => 本文ページ
                return {
                  pageNumber: idx,
                  text: finalPages[idx - 1] || "",
                  prompt: res.finalPrompt,
                  imageUrl: res.imageUrl,
                };
              }
            }),
          },
        },
        include: { pages: true },
      });

      // (c) PageImage 作成
      for (const p of newBook.pages) {
        await tx.pageImage.create({
          data: {
            pageId: p.id,
            imageUrl: p.imageUrl || "",
            promptUsed: p.prompt || "",
            isAdopted: true, // 初回生成 => 全ページ採用済みに
          },
        });
      }

      return newBook;
    });

    console.log("[book created] => ID:", createdBook.id);

    // 11) レスポンス
    return NextResponse.json({ id: createdBook.id, title: createdBook.title });
  } catch (err: any) {
    console.error("[ERROR in /api/ehon/generate]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}