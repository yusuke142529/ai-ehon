"use server";

import { getOpenAI } from "@/services/openaiClient";

export interface RefineStoryFormatParams {
  originalLines: string[]; // 1回目で得たストーリー(行配列)
  pageCount: number;
}

/**
 * GPTに「タイトル + ページ数ぶんの本文」をJSON形式で返させる。
 * 
 * 期待するJSON構造：
 * {
 *   "title": "string",
 *   "pages": [
 *     "page1の本文",
 *     "page2の本文",
 *     ...
 *     "pageNの本文"
 *   ]
 * }
 * - pages.length === pageCount
 * - valid JSON only
 */
export async function refineStoryFormat(
  params: RefineStoryFormatParams
): Promise<{ title: string; pages: string[] }> {
  const { originalLines, pageCount } = params;
  const openai = await getOpenAI();
  if (!openai) {
    throw new Error("OpenAI client not found.");
  }

  // 入力ストーリーを1つのテキストに結合
  const roughText = originalLines.join("\n");

  // developerメッセージ
  const developerMessage = {
    role: "developer" as const,
    content: `
You are an AI that reformats a story into strict JSON with this shape:

{
  "title": "string",
  "pages": [
    "string for page 1",
    "string for page 2",
    ...
    "string for page N"
  ]
}

N must be exactly ${pageCount}.
Do not include any extra keys or text outside of this JSON.
The "pages" array should have exactly ${pageCount} strings, each representing that page's text.
`.trim(),
  };

  // userメッセージ
  const userMessage = {
    role: "user" as const,
    content: `
以下のストーリーを、上記JSON形式で出力してください。

[ルール]
- "title" はストーリーのタイトル
- "pages" は各ページ本文 (合計 ${pageCount}個)
- 必ず valid JSON のみを返す
- 各ページ本文は 1〜2行程度にまとめてOK

元のストーリー:
------------------
${roughText}
------------------
`.trim(),
  };

  let finalResult: { title: string; pages: string[] } = {
    title: "",
    pages: [],
  };

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[refineStoryFormat] => attempt #${attempt}`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // or "gpt-4"
      messages: [developerMessage, userMessage],
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    console.log(`[refineStoryFormat] => raw #${attempt}:`, raw);

    try {
      // ▼ ここでトリプルバッククオート(```)を除去してから JSON.parse する
      const sanitized = raw
        // すべての ```...``` を消し、その中身は残す
        .replace(/```[\s\S]*?```/g, (match) => {
          // 例: ```json { "title": "foo" } ```
          // match は "```json ... ```" という文字列まるごと
          // 中身のみ取り出したい場合は以下のようにしてもOK
          return match
            .replace(/```json\s?/, "") // 先頭の ```json を除去
            .replace(/```/, "")        // 末尾の ```
            .trim();
        })
        .trim();

      // ここでJSONパース
      const parsed = JSON.parse(sanitized) as { title: string; pages: string[] };

      // ページ数が合わない場合のチェック
      if (!parsed.title || !parsed.pages || parsed.pages.length !== pageCount) {
        console.warn("[refineStoryFormat] => JSON structure invalid or pages.length mismatch.");
        if (attempt === maxRetries) {
          // リトライ失敗した場合のfallback
          finalResult = { title: "", pages: Array(pageCount).fill("") };
        }
      } else {
        // 成功
        finalResult = parsed;
        break;
      }
    } catch (err) {
      console.warn("[refineStoryFormat] => JSON parse error:", err);
      if (attempt === maxRetries) {
        // リトライ失敗時
        finalResult = { title: "", pages: Array(pageCount).fill("") };
      }
    }
  }

  return finalResult;
}