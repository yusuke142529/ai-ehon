"use server";

import { getOpenAI } from "@/services/openaiClient";

/**
 * buildFullStory に渡すパラメータ
 */
export interface BuildFullStoryParams {
  pageCount: number; // 5〜30の範囲
  mainCharacter: {
    species: string; // 例: "cat", "owl", "penguin" など
  };
  theme?: string;    // 例: "愛", "勇気", "多様性" など
  genre?: string;    // 例: "森の中", "海辺", "宇宙" など
  ageRange?: string; // 例: "0-2才", "3-5才", "6-8才" など

  /**
   * ストーリーを生成する言語 (ja / en)
   * 未指定の場合は "ja" をデフォルトとする。
   */
  language?: "ja" | "en";
}

/**
 * タイトル + ページ数分のストーリーを生成する。
 */
export async function buildFullStory(
  params: BuildFullStoryParams
): Promise<{
  title: string;
  pages: string[];
}> {
  const openai = await getOpenAI();
  if (!openai) {
    throw new Error("OpenAI client not found.");
  }

  const {
    pageCount,
    mainCharacter,
    theme,
    genre,
    ageRange,
    language = "ja" // ★ デフォルトは日本語
  } = params;

  // 言語に応じて "English" or "Japanese" を決定
  const langName = language === "en" ? "English" : "Japanese";

  //
  // ---- developerメッセージ ----
  //
  // ここにネガティブプロンプト（禁止事項）を含めています。
  //
  const developerMessage = {
    role: "developer" as const,
    content: `
You are a highly skilled picture book writer in ${langName}.
The story should have a clear beginning, middle, and end, split into ${pageCount} pages.
The story must have a title and must include a main character who is a/an ${mainCharacter.species}.

Propose a charming or whimsical name in ${langName} for the main character.

${theme ? `The story's theme is "${theme}".` : ""}
${genre ? `The story's setting or genre is "${genre}".` : ""}
${ageRange ? `The target age range is ${ageRange}.` : ""}

/* Negative prompt (禁止事項):
   - Do not give any name to characters other than the main character.
   - ストーリーの中に登場するメインキャラクター以外のキャラクターには名前を付けないでください。
*/
`.trim()
  };

  //
  // ---- userメッセージ ----
  //
  // 「子ども向けに簡単な文体」等の文言は削除。
  //
  const userMessage = {
    role: "user" as const,
    content: `
[Requirements]
- Create a ${langName} picture book story of ${pageCount} pages.
- Include a title in the format: "Title: ○○" somewhere at the top or first line.
- Then provide the text for each page (1〜${pageCount}) in ${langName}.
- The main character is a/an "${mainCharacter.species}".
- Propose a unique name for the main character in ${langName} and use it throughout the story.
- Keep it warm, whimsical, and avoid overly formal expressions.

${theme ? `- The main theme is "${theme}".` : ""}
${genre ? `- The story's genre or setting is "${genre}".` : ""}
${ageRange ? `- Use language suitable for children aged ${ageRange}.` : ""}
`.trim()
  };

  //
  // ---- GPT呼び出し ----
  //
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [developerMessage, userMessage],
    temperature: 0.8
  });

  const raw = completion.choices[0]?.message?.content?.trim() || "";
  console.log(`[buildFullStory] => raw story:`, raw);

  //
  // ---- タイトルとページ文を抽出 ----
  //
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let title = "Unknown Title";
  const pages: string[] = [];

  // "Title: ○○" の行を探す
  const titleIdx = lines.findIndex((l) => l.startsWith("Title:"));
  if (titleIdx !== -1) {
    title = lines[titleIdx].replace(/^Title:\s*/, "").trim();
  }

  // 残りの行を pages[] に入れる
  lines.forEach((line, idx) => {
    if (idx !== titleIdx) {
      pages.push(line);
    }
  });

  return { title, pages };
}