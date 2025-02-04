"use server";

import { getOpenAI } from "@/services/openaiClient";

/**
 * 1ページずつ GPT に「日本語ストーリー」を渡し、
 * そのページの英語シーン(場面設定)を生成させる。
 *
 * ポイント:
 * - coverStoryText があれば「表紙シーン」を先頭に1つ生成
 * - その後、pageCount 分の本文シーンを生成
 * - 表紙シーン + 本文ページ数 => 合計 pageCount+1 のシーンが返る
 */
export interface BuildSceneParams {
  pageCount: number;          // ユーザーが選択した本文ページ数
  storyTexts: string[];       // JSON で受け取った "pages" (日本語ストーリー本文)
  coverStoryText?: string;    // 表紙用: 物語全文などを結合したテキスト(省略可)
}

/**
 * buildScenePromptsForBook:
 * - coverStoryText があれば表紙シーンを先頭に生成
 * - 続けて pageCount 個の本文ページシーンを作って返す
 */
export async function buildScenePromptsForBook(
  params: BuildSceneParams
): Promise<string[]> {
  const openai = await getOpenAI();
  if (!openai) {
    throw new Error("OpenAI client not found.");
  }

  const {
    pageCount,
    storyTexts,
    coverStoryText, // 物語全文など
  } = params;

  // 返却用配列
  const scenePrompts: string[] = [];

  // 直前ページのシーン内容
  let previousScenePrompt = "";

  // -------------------------------------------------------
  // (A) カバーシーン生成 (coverStoryTextがあれば)
  // -------------------------------------------------------
  if (coverStoryText) {
    // developerメッセージ: 
    // 「物語の全文を読み取り、子供向けの表紙シーンを 30〜40トークン程度で描いて」
    const developerCoverMessage = {
      role: "developer" as const,
      content: `
You are an AI assistant that creates a short English scene prompt for a children's picture book cover.
Focus on physically visible elements: environment, objects, characters' outward appearance.
Do NOT mention the story title or deep lore.
No mention of art style or internal emotions.
Output must be around 30–40 tokens.
`.trim(),
    };

    const userCoverMessage = {
      role: "user" as const,
      content: `
Below is the full story content. Please read it carefully:

[STORY]
${coverStoryText}

Now, based on this story, create a single short English scene description (30–40 tokens) for the cover.
Only describe visible details that reflect the essence of the story.
Do not mention any title. Do not exceed 40 tokens.
`.trim(),
    };

    const coverCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [developerCoverMessage, userCoverMessage],
      temperature: 0.7,
    });

    const coverRaw = coverCompletion.choices[0]?.message?.content?.trim() || "";
    console.log(`[buildScenePromptsForBook] => cover scene raw:`, coverRaw);

    scenePrompts.push(coverRaw);
    previousScenePrompt = coverRaw; // 次ページで参照可能
  }

  // -------------------------------------------------------
  // (B) 本文ページ 1〜pageCount のシーン生成
  // -------------------------------------------------------
  for (let i = 0; i < pageCount; i++) {
    const japaneseText = storyTexts[i] || "(No text for this page)";

    // developerメッセージ: 
    // 1ページ分の日本語ストーリー→英語シーンに変換
    const developerContent = `
You are an AI assistant that converts a single page of Japanese storybook text into a short English scene prompt.
Focus on physically visible elements: environment, objects, background, time of day, outward aspects of characters.
No mention of art style or internal emotions.
Output must be 30–40 tokens.
`.trim();

    const developerMessage = {
      role: "developer" as const,
      content: developerContent,
    };

    // userメッセージ
    let userContent = `
We have page ${i + 1} of a Japanese story:
${japaneseText}

Please create a short English scene description (30–40 tokens) focusing on:
- The setting's location, time of day, objects, background
- Physically visible character actions or expressions
No art style or internal emotions. 
Do not exceed 40 tokens.
`.trim();

    // 2ページ目以降のみ、前のページのシーンを考慮(オプショナル)
    if (i > 0 && previousScenePrompt) {
      userContent += `
(Optional) You may consider the previous page's scene for continuity:
"${previousScenePrompt}"
But keep the current page's details concise.
`.trim();
    }

    const userMessage = {
      role: "user" as const,
      content: userContent,
    };

    // GPT呼び出し
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [developerMessage, userMessage],
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    console.log(`[buildScenePromptsForBook] => page ${i + 1} raw:`, raw);

    scenePrompts.push(raw);
    previousScenePrompt = raw;
  }

  return scenePrompts;
}