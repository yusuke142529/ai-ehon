//src/app/api/stripe-webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { handleStripeWebhook } from '@/services/paymentService';

// --- RuntimeをNode.jsに設定 (Stripe署名検証で必須) ---
export const runtime = 'nodejs';

// [POST] /api/stripe-webhook
export async function POST(req: NextRequest) {
  // Stripe から送られる署名
  const signature = req.headers.get('stripe-signature') || '';

  try {
    // Webhook のボディを ArrayBuffer で受け取る
    const buf = await req.arrayBuffer();

    // paymentService.ts の handleStripeWebhook() で署名検証 & イベントハンドリング
    await handleStripeWebhook({
      rawBody: Buffer.from(buf),
      signature,
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Stripe Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }
}