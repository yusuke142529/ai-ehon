//src/services/stableDiffusionService.ts

"use server";

import fetch from "node-fetch";
import FormData from "form-data";

// 環境変数からAPIキーを読み込む (例: "sk-myapikey")
const STABILITY_API_KEY = process.env.STABILITY_API_KEY || "";

// Ultra用のエンドポイント
// POST /v2beta/stable-image/generate/ultra
const STABILITY_ULTRA_ENDPOINT = "https://api.stability.ai/v2beta/stable-image/generate/ultra";

export interface StabilityGenerateOptions {
  /** テキストプロンプト（必須） */
  prompt: string;
  /** 出力フォーマット: "png" | "jpeg" | "webp" */
  outputFormat?: string;
  /** aspect_ratio: "1:1", "16:9"など */
  aspectRatio?: string;
  /** 出力したくない要素 (negative prompt) */
  negativePrompt?: string;
  /** "image/*" (バイナリ) or "application/json" */
  acceptMode?: "image/*" | "application/json";
  /** cfg_scale (1〜10) - 今回は固定9でもOK */
  cfgScale?: number;
  /**
   * sampler種類
   * 例: "dpmpp_2s_a_karras" "euler-a" "ddim" "k_lms" etc.
   * Ultraエンドポイントでは "sampler" パラメータとして送れる
   */
  sampler?: string;
  /** ステップ数 (1〜100くらい) */
  steps?: number;
  /** seed: 0 or undefined => ランダム */
  seed?: number;
}

/**
 * 画像生成時のレスポンス
 */
export interface StabilityGenerateResponse {
  rawBuffer: Buffer;
  base64?: string; // acceptMode="application/json" の場合のみ
  status: number;
}

/**
 * Stable Image Ultra エンドポイントで画像を生成する
 * - sampler="dpmpp_2s_a_karras"
 * - cfgScale=9
 * - steps=30
 * - seed=0 => API側でランダムに
 */
export async function generateStabilityUltraImage(
  opts: StabilityGenerateOptions
): Promise<StabilityGenerateResponse> {
  if (!STABILITY_API_KEY) {
    throw new Error("STABILITY_API_KEY is missing or invalid.");
  }

  // 1. 受信モード (デフォルト: image/*)
  const acceptMode = opts.acceptMode || "image/*";

  // 2. multipart form で送信
  const form = new FormData();

  // 必須: prompt
  form.append("prompt", opts.prompt);

  //
  // sampler: デフォルトを "dpmpp_2s_a_karras" に変更
  //
  form.append("sampler", opts.sampler ?? "dpmpp_2s_a_karras");

  // cfg_scale
  const cfgScaleNum = typeof opts.cfgScale === "number" ? opts.cfgScale :5;
  form.append("cfg_scale", String(cfgScaleNum));

  // steps
  const stepsNum = typeof opts.steps === "number" ? opts.steps : 30;
  form.append("steps", String(stepsNum));

  // seed=0 => ランダム
  if (typeof opts.seed === "number") {
    form.append("seed", String(opts.seed));
  } else {
    form.append("seed", "0"); // デフォルトでランダムに
  }

  //
  // オプションパラメータ
  //
  // output_format
  if (opts.outputFormat) {
    form.append("output_format", opts.outputFormat);
  } else {
    form.append("output_format", "png");
  }

  // aspect_ratio
  if (opts.aspectRatio) {
    form.append("aspect_ratio", opts.aspectRatio);
  }

  // negative_prompt
  if (opts.negativePrompt) {
    form.append("negative_prompt", opts.negativePrompt);
  }

  // 3. 実際のAPI呼び出し
  const res = await fetch(STABILITY_ULTRA_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STABILITY_API_KEY}`,
      Accept: acceptMode,
    },
    body: form,
  });

  const status = res.status;
  if (!res.ok) {
    // エラー時 => テキストを読み取ってスロー
    const errText = await res.text();
    throw new Error(`Stable Image Ultra error: ${status} ${errText}`);
  }

  // 4. レスポンス
  if (acceptMode === "image/*") {
    // バイナリを直接取得
    const buf = Buffer.from(await res.arrayBuffer());
    return { rawBuffer: buf, status };
  } else {
    // JSON (+ base64)
    const json = await res.json();
    const base64 = json?.content;
    if (!base64) {
      throw new Error("No base64 in JSON response from Ultra");
    }
    return {
      rawBuffer: Buffer.from(base64, "base64"),
      base64,
      status,
    };
  }
}