// src/app/api/auth/forgot/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { randomBytes } from "crypto";
import { sendMail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json(
        { error: "メールアドレスを入力してください" },
        { status: 400 }
      );
    }

    // ユーザー検索
    const user = await prisma.user.findUnique({ where: { email } });
    // 存在しない場合でも同一メッセージを返す(セキュリティ対策)
    if (!user) {
      return NextResponse.json(
        { message: "パスワードリセット手続きを受け付けました。" },
        { status: 200 }
      );
    }

    // （ここでメール検証チェックをしないことを決定）
    // if (!user.emailVerified) { ... } は削除済み

    // リセット用トークンを作成
    const tokenValue = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30分有効

    // verificationTokenへ upsert
    await prisma.verificationToken.upsert({
      where: { token: tokenValue },
      update: { expires },
      create: {
        identifier: email,
        token: tokenValue,
        expires,
      },
    });

    // ★ここでロケール付きURLを生成する例 (ja固定)
    // 例: http://localhost:3000/ja/auth/reset?token=xxxx
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/ja/auth/reset?token=${tokenValue}`;

    // メール送信
    await sendMail({
      to: email,
      subject: "【AIえほんメーカー】パスワードリセットのご案内",
      html: `
<p>以下のリンクより、パスワードを再設定してください。（30分以内有効）</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
      `,
    });

    return NextResponse.json(
      { message: "パスワードリセット手続きを受け付けました。" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/auth/forgot:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}