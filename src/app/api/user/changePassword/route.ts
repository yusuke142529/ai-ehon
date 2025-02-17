// src/app/api/user/changePassword/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { ensureActiveUser } from "@/lib/serverCheck";
import bcrypt from "bcrypt";

// サーバー用バリデーション
import { validatePasswordServer } from "@/lib/serverPasswordValidation";

/**
 * PATCH /api/user/changePassword
 * Body: { currentPassword: string, newPassword: string }
 *  - ログイン中のユーザーのパスワードを更新する
 */
interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export async function PATCH(req: Request) {
  try {
    // 1) ログイン & 退会済みでないかチェック
    const check = await ensureActiveUser();
    if (check.error || !check.user) {
      return NextResponse.json(
        { error: check.error || "Unauthorized" },
        { status: check.status || 401 }
      );
    }
    const userId = check.user.id;

    // 2) Request Body 取得
    const { currentPassword, newPassword } = (await req.json()) as ChangePasswordBody;
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "現在のパスワードと新しいパスワードは必須です。" },
        { status: 400 }
      );
    }

    // 3) 現在のパスワードが合っているか確認
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hashedPassword: true },
    });
    if (!user || !user.hashedPassword) {
      return NextResponse.json(
        { error: "ユーザー情報が見つかりません" },
        { status: 404 }
      );
    }

    const isMatch = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!isMatch) {
      return NextResponse.json(
        { error: "現在のパスワードが一致しません" },
        { status: 400 }
      );
    }

    // 4) 新パスワードのサーバー側バリデーション
    const passwordError = validatePasswordServer(newPassword);
    if (passwordError) {
      return NextResponse.json(
        { error: passwordError },
        { status: 400 }
      );
    }

    // 5) ハッシュ化して更新
    const newHashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { hashedPassword: newHashed },
    });

    // 成功
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[PATCH /api/user/changePassword] =>", error);
    let message = "Internal Server Error";
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}