// src/app/api/auth/reset/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { hash } from "bcryptjs";
// ★ 登録時と同じく zxcvbn を用いる
import zxcvbn from "zxcvbn";


export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "トークンまたはパスワードが不足しています" },
        { status: 400 }
      );
    }

    // (A) 登録時と同様のパスワード強度チェック (zxcvbn)
    const { score } = zxcvbn(newPassword);
    if (score < 3) {
      return NextResponse.json(
        { error: "パスワードが脆弱です。より複雑なパスワードを使用してください" },
        { status: 400 }
      );
    }

    // (B) トークンを検索
    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { token },
    });
    if (!tokenRecord) {
      return NextResponse.json(
        { error: "無効なトークンです" },
        { status: 400 }
      );
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
  } catch (error: any) {
    console.error("[POST /api/auth/reset] Error:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}