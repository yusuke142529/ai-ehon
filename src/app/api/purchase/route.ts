// src/app/api/purchase/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { createCheckoutSession } from "@/services/paymentService";
import { ensureActiveUser } from "@/lib/serverCheck"; // ★追加

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // 1) ログイン & 退会チェック
    const check = await ensureActiveUser();
    if (check.error) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }
    const userId = check.user.id;

    // 2) Body から購入情報を取得
    const body = await req.json();
    const { currency, price, credits, locale } = body || {};

    if (!locale) {
      return NextResponse.json({ error: "No locale specified" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const successUrl = `${baseUrl}/${locale}/purchase/success?credits=${credits}`;
    const cancelUrl  = `${baseUrl}/${locale}/purchase?purchase=cancel`;

    // 3) Stripe Checkout セッション作成
    const checkoutSession = await createCheckoutSession({
      userId,
      currency,
      price,
      credits,
      successUrl,
      cancelUrl,
    });

    // 4) セッションURLをフロントへ返却
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}