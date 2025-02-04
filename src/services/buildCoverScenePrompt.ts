// src/services/buildCoverScenePrompt.ts

"use server";

import { getOpenAI } from "@/services/openaiClient";

/**
 * 表紙イラスト用の英語プロンプトを GPT-4o で生成。
 *   - タイトルを使って、カバーにふさわしいシーン説明を作る
 *   - mainCharacter があれば組み込む
 */
export async function buildCoverScenePrompt({
    title,
    mainCharacter,
}: {
    title: string;
    mainCharacter?: {
        species: string;
        name?: string;
    };
}): Promise<string> {
    const openai = await getOpenAI();
    if (!openai) {
        throw new Error("OpenAI client not found.");
    }

    // 開発者メッセージ（developer ロール）
    const developerMessage = {
        role: "developer" as const,
        content: `
You are an AI that composes a short English prompt for a children's book cover illustration.
Focus on environment and main character presence.
Avoid detailed art style. Keep it whimsical yet straightforward.
`.trim(),
    };

    // ユーザーメッセージ（user ロール）
    let userContent = `
We have a picture book titled "${title}".
We need a short English scene describing the cover illustration.
Mention the atmosphere, the main character if known, and the sense that this is the cover page.
`.trim();

    if (mainCharacter) {
        userContent += `
The main character is a/an ${mainCharacter.species}${
            mainCharacter.name ? " named " + mainCharacter.name : ""
        }.
`;
    }

    const userMessage = {
        role: "user" as const,
        content: userContent,
    };

    // GPT-4o 呼び出し
    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [developerMessage, userMessage],
        temperature: 0.8,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    console.log("[buildCoverScenePrompt] => raw cover scene:", raw);

    // 先頭に "Scene 0:" とラベル付け（任意）
    return `Scene 0: ${raw}`;
}