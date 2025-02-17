// src/app/api/user/resendVerification/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import crypto from "crypto";
import { sendRegistrationEmail } from "@/lib/sendRegistrationEmail";

/**
 * POST /api/user/resendVerification
 * Body: { email: string }
 *
 * - まだ emailVerified = null のユーザーに対して、トークンを再発行しメールを再送する。
 * - 退会済みユーザー (deletedAt != null) はエラーを返す（再登録のほうが必要）。
 */
interface ResendVerificationBody {
  email: string;
}

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as ResendVerificationBody;
    if (!email) {
      return NextResponse.json(
        { error: "メールアドレスがありません" },
        { status: 400 }
      );
    }

    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        deletedAt: true,
        emailVerified: true,
        email: true,
      },
    });
    if (!user) {
      return NextResponse.json(
        { error: "該当ユーザーが存在しません" },
        { status: 404 }
      );
    }

    // 退会済みユーザーの場合は「再登録してください」とエラーにする
    if (user.deletedAt) {
      return NextResponse.json(
        { error: "退会済みユーザーです。再登録を行ってください。" },
        { status: 400 }
      );
    }

    // 既に認証済み？
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "既にメール認証が完了しています" },
        { status: 400 }
      );
    }

    // 新しいトークンを発行 (古いものを消すかどうかは要件次第 => ここでは deleteMany)
    const tokenValue = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 古いtokenを削除
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email },
    });

    // 新しいtokenを作成
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: tokenValue,
        expires,
      },
    });

    // メール再送
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${tokenValue}`;
    await sendRegistrationEmail(user.email, user.name ?? "", verifyUrl);

    return NextResponse.json(
      { message: "認証メールを再送しました。ご確認ください。" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/user/resendVerification] Error:", error);
    let msg = "サーバーエラーが発生しました";
    if (error instanceof Error) {
      msg = error.message;
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}