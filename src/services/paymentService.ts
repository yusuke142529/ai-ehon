// src/services/paymentService.ts

import Stripe from 'stripe';
import { prisma } from '@/lib/prismadb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
});

// Checkout セッション作成時の引数
interface CreateCheckoutSessionParams {
  userId: string | number;
  currency: 'usd' | 'jpy';
  price: number;    // 例: 5, 10, 500, 1000 ...
  credits: number;  // 例: 500, 1000 ...
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
  // unit_amount はUSDならセント(×100), JPYなら1円単位
  const unitAmount = currency === 'usd' ? price * 100 : price;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
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
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: String(userId),
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
 * Stripe Webhook を受け取り支払い完了時にポイント加算
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
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    throw new Error('Webhook signature verification failed.');
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      // metadataに保存した userId / credits / price 等を取り出す
      const userId = Number(session.metadata?.userId);
      const credits = Number(session.metadata?.credits || 0);
      const currency = session.metadata?.currency;
      const price = Number(session.metadata?.price || 0);
      const stripeId = session.id;

      // 決済成功チェック
      if (session.payment_status === 'paid' && userId && credits > 0) {
        // 1) ユーザーにクレジット加算
        await prisma.user.update({
          where: { id: userId },
          data: {
            points: { increment: credits },
          },
        });

        // 2) Purchaseテーブルに履歴登録
        const newPurchase = await prisma.purchase.create({
          data: {
            userId,
            amountYen: currency === 'jpy' ? price : 0,
            pointsAdded: credits,
            stripeId,
          },
        });

        // 3) Point_Historyテーブルも記録 (任意)
        await prisma.point_History.create({
          data: {
            userId,
            changeAmount: credits,
            reason: 'purchase',
            relatedId: newPurchase.id,
          },
        });
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
      break;
  }
}