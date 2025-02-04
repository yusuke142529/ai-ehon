// src/app/api/user/updateProfile/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { ensureActiveUser } from "@/lib/serverCheck"; // ★追加

/**
 * PATCH /api/user/updateProfile
 * Body: { name?: string; iconUrl?: string }
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
    const { name, iconUrl } = (await req.json()) as {
      name?: string;
      iconUrl?: string;
    };

    // 3) DB更新
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        iconUrl: iconUrl || undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[updateProfile] =>", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}