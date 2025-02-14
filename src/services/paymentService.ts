// src/services/paymentService.ts

import Stripe from "stripe";
import { prisma } from "@/lib/prismadb";

// Stripeを初期化 (acaciaバージョン)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

/**
 * Checkout セッション作成時の引数
 */
interface CreateCheckoutSessionParams {
  userId: string; // string (UUID)
  currency: "usd" | "jpy";
  price: number;
  credits: number;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Stripe Checkout セッションを作成
 */
export async function createCheckoutSession({
  userId,
  currency,
  price,
  credits,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams) {
  // unit_amount
  const unitAmount = currency === "usd" ? price * 100 : price;

  // メタデータに userId, price, credits を保存
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
      userId,
      currency,
      price: String(price),
      credits: String(credits),
    },
  });

  return session;
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
  } catch {
    // err 未使用回避のため、引数を削除 or `_err` に置き換え
    throw new Error("Webhook signature verification failed.");
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // メタデータから情報を取り出す
      const userId = session.metadata?.userId; 
      const creditsStr = session.metadata?.credits || "0";
      const priceStr = session.metadata?.price || "0";
      const currency = session.metadata?.currency || "";
      const stripeId = session.id;

      const credits = parseInt(creditsStr, 10) || 0;
      const price = parseInt(priceStr, 10) || 0;

      if (session.payment_status === "paid" && userId && credits > 0) {
        // 1) ユーザーにクレジット加算
        await prisma.user.update({
          where: { id: userId },
          data: { points: { increment: credits } },
        });

        // 2) Purchase テーブルに登録
        const newPurchase = await prisma.purchase.create({
          data: {
            userId,
            amountYen: currency === "jpy" ? price : 0,
            pointsAdded: credits,
            stripeId,
          },
        });

        // 3) PointHistory にも記録
        await prisma.pointHistory.create({
          data: {
            userId,
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