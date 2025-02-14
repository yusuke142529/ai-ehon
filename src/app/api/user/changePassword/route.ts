export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { ensureActiveUser } from "@/lib/serverCheck";
import bcrypt from "bcrypt";

/**
 * PATCH /api/user/changePassword
 * Body: { currentPassword: string, newPassword: string }
 *  - ログインユーザー自身のパスワードを更新
 */
interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export async function PATCH(req: Request) {
  try {
    // 1) ログイン & 退会チェック
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
        { error: "Missing password" },
        { status: 400 }
      );
    }

    // 3) DBから hashedPassword を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hashedPassword: true },
    });
    if (!user || !user.hashedPassword) {
      return NextResponse.json(
        { error: "User not found or no password" },
        { status: 404 }
      );
    }

    // 4) 現在のパスワード一致チェック
    const isMatch = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!isMatch) {
      return NextResponse.json(
        { error: "現在のパスワードが一致しません" },
        { status: 400 }
      );
    }

    // 5) 新しいパスワードをハッシュ化
    const newHashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { hashedPassword: newHashed },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[changePassword] =>", error);
    let message = "Internal Server Error";
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
