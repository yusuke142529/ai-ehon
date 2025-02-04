"use server";

import { generateStabilityUltraImage } from "./stableDiffusionService";
import { uploadImageBufferToS3 } from "./s3Service";
import { v4 as uuidv4 } from "uuid";

/**
 * キャラクターデザイン (英語)
 * 絵のスタイル (英語)
 * 各ページシーン (英語)
 */
interface GenerateAllImagesOptions {
  characterPrompt: string; // 例: "Children's book illustration of a two-head-tall, anthropomorphized fox..."
  stylePrompt: string;     // 例: "Studio Ghibli style..."
  scenePrompts: string[];  // 例: ["Cover scene...", "Page1: ...", "Page2: ...", ...]
}

/**
 * ページ生成結果
 */
interface PageResult {
  imageUrl: string;    // 生成＆アップした画像URL
  finalPrompt: string; // 実際に使用した最終prompt
}

/**
 * Stable Image Ultra でページ(およびカバー)を連続生成し、S3にアップロードする。
 * sampler="euler-a", cfg_scale=9, steps=30, seed=0 (ランダム)
 * は stableDiffusionService.ts 側で設定済。
 *
 * => 戻り値として PageResult[] を返し、
 *    各要素 {imageUrl, finalPrompt} に生成画像URLと使用promptを含める。
 *
 * scenePrompts[0] がカバー用シーンになる場合があるため、
 * i=0 をCover、i=1以降をPage1, Page2...という形で扱ってもOK。
 */
export async function generateAllImagesStabilityUltra(
  opts: GenerateAllImagesOptions
): Promise<PageResult[]> {
  console.log("[generateAllImagesStabilityUltra] => Start image generation (ULTRA).");

  const { characterPrompt, stylePrompt, scenePrompts } = opts;
  const results: PageResult[] = [];

  for (let i = 0; i < scenePrompts.length; i++) {
    // シーンの内容を整形
    const sceneText = scenePrompts[i].trim();

    // カバーと本文ページの区別はログ出力で示す（必須ではないが分かりやすいため）
    const isCover = (i === 0 && scenePrompts.length > 1);
    const pageLabel = isCover ? "Cover" : `Page ${i}`;

    // キャラPrompt, スタイルPrompt, シーンテキストを結合
    const finalPrompt = [
      characterPrompt.trim(),
      sceneText,
      stylePrompt.trim(),
    ].join("\n");

    console.log(
      `[generateAllImagesStabilityUltra] => Generating ${pageLabel} prompt:\n${finalPrompt}\n`
    );

    // (A) Ultra画像生成
    const pageRes = await generateStabilityUltraImage({
      prompt: finalPrompt,
      // sampler, cfg_scale, steps, seed => stableDiffusionService.ts 側
      acceptMode: "image/*", // バイナリ形式で取得
    });

    // (B) アップロード用ファイル名をユニーク化
    const uniqueFilename = `page_${i}_${Date.now()}_${uuidv4()}.png`;

    console.log(`[generateAllImagesStabilityUltra] => Uploading ${uniqueFilename} to S3...`);
    const pageUrl = await uploadImageBufferToS3(
      pageRes.rawBuffer,
      uniqueFilename,
      "image/png"
    );

    console.log(`[generateAllImagesStabilityUltra] => ${pageLabel} s3Url=`, pageUrl);

    // 結果を配列に追加
    results.push({
      imageUrl: pageUrl,
      finalPrompt,
    });
  }

  console.log("[generateAllImagesStabilityUltra] => All images done using ULTRA endpoint.");
  return results;
}