// src/app/api/purchase/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { createCheckoutSession } from "@/services/paymentService";
import { ensureActiveUser } from "@/lib/serverCheck";

export async function POST(req: NextRequest) {
  try {
    // 1) ログイン & 退会チェック
    const check = await ensureActiveUser();
    if (check.error || !check.user) {
      // ensureActiveUser が失敗した
      return NextResponse.json(
        { error: check.error || "Unauthorized" },
        { status: check.status || 401 }
      );
    }
    const userId = check.user.id; // string (UUID)

    // 2) Body から購入情報を取得
    const body = await req.json().catch(() => null) as {
      currency?: string;
      price?: number;
      credits?: number;
      locale?: string;
    } | null;

    if (!body) {
      // JSONパース失敗など
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { currency, price, credits, locale } = body;

    // バリデーション: 全て必須
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

    // 3) 環境変数チェック: NEXT_PUBLIC_APP_URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      // baseUrl 未設定 -> ここでエラー応答 or fallback
      return NextResponse.json(
        { error: "NEXT_PUBLIC_APP_URL is not configured." },
        { status: 500 }
      );
    }

    // 4) successUrl / cancelUrl を生成
    //    例: /ja/purchase/success?credits=??? / /ja/purchase
    const successUrl = `${baseUrl}/${locale}/purchase/success?credits=${credits}`;
    const cancelUrl = `${baseUrl}/${locale}/purchase?purchase=cancel`;

    // 5) Stripe Checkout セッション作成
    const checkoutSession = await createCheckoutSession({
      userId,       // string
      currency,     // "usd" or "jpy" etc.
      price,        // number
      credits,      // number
      successUrl,
      cancelUrl,
    });

    if (!checkoutSession?.url) {
      return NextResponse.json({ error: "Failed to create CheckoutSession" }, { status: 500 });
    }

    // 6) セッションURLを返却
    return NextResponse.json({ url: checkoutSession.url });

  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}