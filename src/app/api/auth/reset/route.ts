// src/app/api/auth/reset/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { hash } from "bcrypt";

// ★ サーバー用パスワードバリデーションをインポート
import { validatePasswordServer } from "@/lib/serverPasswordValidation";

interface ResetRequestBody {
  token: string;
  newPassword: string;
}

export async function POST(req: Request) {
  try {
    const { token, newPassword } = (await req.json()) as ResetRequestBody;
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "トークンまたはパスワードが不足しています" },
        { status: 400 }
      );
    }

    // (A) パスワード強度チェック（serverPasswordValidation を使用）
    const passwordError = validatePasswordServer(newPassword);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    // (B) トークンを検索
    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { token },
    });
    if (!tokenRecord) {
      return NextResponse.json({ error: "無効なトークンです" }, { status: 400 });
    }

    // (C) 有効期限チェック
    if (tokenRecord.expires < new Date()) {
      return NextResponse.json(
        { error: "トークンの有効期限が切れています" },
        { status: 400 }
      );
    }

    // (D) ユーザー特定
    const user = await prisma.user.findUnique({
      where: { email: tokenRecord.identifier },
    });
    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // (E) パスワード更新 (bcryptハッシュ)
    const hashedPassword = await hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { hashedPassword },
    });

    // (F) 使用済みトークン削除
    await prisma.verificationToken.delete({
      where: { token },
    });

    return NextResponse.json(
      { message: "パスワードをリセットしました。" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/auth/reset] Error:", error);

    let errorMessage = "サーバーエラーが発生しました";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}