// src/services/paymentService.ts

import Stripe from "stripe";
import { prisma } from "@/lib/prismadb";

// Stripeを初期化 (acaciaバージョン)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-01-27.acacia",
});

/**
 * Checkout セッション作成時の引数
 *  - userId: string (UUID) を推奨
 *  - currency: "usd" | "jpy" 等
 *  - price: 例) USDなら 5,10 (内部で x100), JPYなら 500,1000 など
 *  - credits: 付与ポイント
 *  - successUrl / cancelUrl
 */
interface CreateCheckoutSessionParams {
  userId: string;              // ★ ここを string に統一
  currency: "usd" | "jpy";
  price: number;               // 例: 5, 10, 500, 1000 ...
  credits: number;             // 例: 500, 1000 ...
  successUrl: string;
  cancelUrl: string;
}

/**
 * Stripe Checkout セッションを作成
 */
export async function createCheckoutSession({
  userId,      // string
  currency,
  price,
  credits,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams) {
  // unit_amount は USDならセント換算, JPYならそのまま1円単位
  const unitAmount = currency === "usd" ? price * 100 : price;

  // メタデータに userId, price, credits などを文字列で保存
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `Credit Pack: ${price} ${currency.toUpperCase()}`,
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: userId,           // ★ string のまま保存
      currency,
      price: String(price),     // 数値を文字列に
      credits: String(credits), // 数値を文字列に
    },
  });

  return session; // session.url をフロントに返す
}

// Webhook 引数
interface HandleStripeWebhookParams {
  rawBody: Buffer;
  signature: string;
}

/**
 * Stripe Webhook を受け取り、支払い完了時にポイント加算
 */
export async function handleStripeWebhook({
  rawBody,
  signature,
}: HandleStripeWebhookParams) {
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    throw new Error("Webhook signature verification failed.");
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // 1) メタデータから情報を取り出す (userIdは文字列)
      const userId = session.metadata?.userId; // string | undefined
      const creditsStr = session.metadata?.credits || "0";
      const priceStr = session.metadata?.price || "0";
      const currency = session.metadata?.currency || "";
      const stripeId = session.id;

      // 2) 数値項目は parseInt
      const credits = parseInt(creditsStr, 10) || 0;
      const price = parseInt(priceStr, 10) || 0;

      // 3) 決済が成功したか確認
      if (session.payment_status === "paid" && userId && credits > 0) {
        // ★ userId は string => DB操作時も string
        //    User.id, Purchase.userId が string であることを前提

        // 3-1) ユーザーにクレジット加算
        await prisma.user.update({
          where: { id: userId }, // ← 文字列
          data: {
            points: { increment: credits },
          },
        });

        // 3-2) Purchaseテーブルに履歴登録
        const newPurchase = await prisma.purchase.create({
          data: {
            userId,                  // string
            amountYen: currency === "jpy" ? price : 0,
            pointsAdded: credits,
            stripeId,
          },
        });

        // 3-3) PointHistoryテーブルにも記録
        await prisma.pointHistory.create({
          data: {
            userId,         // string
            changeAmount: credits,
            reason: "purchase",
            relatedId: newPurchase.id,
          },
        });

        console.log(`User ${userId} purchased +${credits} credits.`);
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
      break;
  }
}