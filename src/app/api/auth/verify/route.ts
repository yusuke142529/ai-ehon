// src/app/api/auth/verify/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";

export async function GET(request: Request) {
  try {
    const { searchParams, pathname } = new URL(request.url);
    const tokenValue = searchParams.get("token");

    if (!tokenValue) {
      return NextResponse.json({ error: "トークンがありません" }, { status: 400 });
    }

    // DBでトークンを検索
    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { token: tokenValue },
    });
    if (!tokenRecord) {
      return NextResponse.json({ error: "無効なトークンです" }, { status: 400 });
    }

    // 期限切れチェック
    if (tokenRecord.expires < new Date()) {
      return NextResponse.json({ error: "トークンの有効期限が切れています" }, { status: 400 });
    }

    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email: tokenRecord.identifier },
    });
    if (!user) {
      return NextResponse.json({ error: "ユーザーが存在しません" }, { status: 404 });
    }

    // emailVerified を更新
    await prisma.user.update({
      where: { email: user.email },
      data: {
        emailVerified: new Date(),
      },
    });

    // トークン削除 (一度きりの有効化)
    await prisma.verificationToken.delete({
      where: { token: tokenValue },
    });

    // --- ロケールをpathnameから取得してリダイレクト先を決定 ---
    // pathname例: "/ja/auth/verify" -> ["", "ja", "auth", "verify"]
    // 先頭の "" を除いた segments[1] が "ja" または "en"
    const segments = pathname.split("/"); // ['', 'ja', 'auth', 'verify']
    let locale = segments[1] || "ja";     // デフォルトは "ja" などお好みで

    // 必要に応じて、対応ロケールの配列を用意してチェックすることも可能
    const supportedLocales = ["ja", "en"];
    if (!supportedLocales.includes(locale)) {
      locale = "ja";  // デフォルトロケールにフォールバック
    }

    // (verified=1 をクエリにつけてログインページへリダイレクト)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/auth/login?verified=1`
    );

  } catch (error: unknown) {
    let message = "Internal Server Error";
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
