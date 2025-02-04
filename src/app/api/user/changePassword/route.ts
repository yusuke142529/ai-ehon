//src/app/api/user/changePassword/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { ensureActiveUser } from "@/lib/serverCheck"; // ★追加
import bcrypt from "bcrypt";

/**
 * PATCH /api/user/changePassword
 * Body: { currentPassword: string, newPassword: string }
 *  - ログインユーザー自身のパスワードを更新
 */
export async function PATCH(req: Request) {
  try {
    // 1) ログイン & 退会チェック
    const check = await ensureActiveUser();
    if (check.error) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }
    const userId = check.user.id;

    // 2) Body取得
    const { currentPassword, newPassword } = (await req.json()) as {
      currentPassword: string;
      newPassword: string;
    };
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing password" }, { status: 400 });
    }

    // 3) DBから hashedPassword を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hashedPassword: true },
    });
    if (!user || !user.hashedPassword) {
      return NextResponse.json({ error: "User not found or no password" }, { status: 404 });
    }

    // 4) 現在のパスワード一致チェック
    const isMatch = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!isMatch) {
      return NextResponse.json({ error: "現在のパスワードが一致しません" }, { status: 400 });
    }

    // 5) 新しいパスワードをハッシュ化
    const newHashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { hashedPassword: newHashed },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[changePassword] =>", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}