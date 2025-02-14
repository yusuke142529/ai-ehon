// src/app/api/purchase/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/services/paymentService";
import { ensureActiveUser } from "@/lib/serverCheck";

interface PurchaseRequestBody {
  currency?: string;
  price?: number;
  credits?: number;
  locale?: string;
}

/**
 * currencyを"usd"または"jpy"に正規化し、それ以外はエラーを投げる関数
 */
function normalizeCurrency(input: string): "usd" | "jpy" {
  const lower = input.toLowerCase();
  if (lower === "usd") return "usd";
  if (lower === "jpy") return "jpy";
  throw new Error(`Unsupported currency: ${input}`);
}

export async function POST(req: NextRequest) {
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

    // 2) Body から購入情報を取得
    let body: PurchaseRequestBody | null = null;
    try {
      body = (await req.json()) as PurchaseRequestBody;
    } catch {
      // JSON parse error
      body = null;
    }
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { currency, price, credits, locale } = body;

    // 必須項目チェック
    if (!locale) {
      return NextResponse.json({ error: "locale is required" }, { status: 400 });
    }
    if (!currency) {
      return NextResponse.json({ error: "currency is required" }, { status: 400 });
    }
    if (!price || price <= 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }
    if (!credits || credits <= 0) {
      return NextResponse.json({ error: "Invalid credits" }, { status: 400 });
    }

    // 3) 環境変数チェック
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_APP_URL is not configured." },
        { status: 500 }
      );
    }

    // 4) success / cancel URL
    const successUrl = `${baseUrl}/${locale}/purchase/success?credits=${credits}`;
    const cancelUrl = `${baseUrl}/${locale}/purchase?purchase=cancel`;

    // 5) currency を "usd"|"jpy" に変換 (エラー時に例外を投げる)
    let normalizedCurrency: "usd" | "jpy";
    try {
      normalizedCurrency = normalizeCurrency(currency);
    } catch (err) {
      // "Unsupported currency: hogehoge" など
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 400 }
      );
    }

    // 6) Stripe Checkout セッション作成
    const checkoutSession = await createCheckoutSession({
      userId,
      currency: normalizedCurrency, // ここは "usd"|"jpy" になる
      price,
      credits,
      successUrl,
      cancelUrl,
    });

    if (!checkoutSession?.url) {
      return NextResponse.json(
        { error: "Failed to create CheckoutSession" },
        { status: 500 }
      );
    }

    // 7) セッションURLを返却
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: unknown) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}