// src/app/api/user/updateProfile/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismadb";
import { ensureActiveUser } from "@/lib/serverCheck";

/**
 * PATCH /api/user/updateProfile
 * Body: { name?: string; image?: string }
 */
interface UpdateProfileBody {
  name?: string;
  image?: string;
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

    // 2) Body取得
    const { name, image } = (await req.json()) as UpdateProfileBody;

    // 3) DB更新
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        image: image || undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[updateProfile] =>", error);

    let msg = "Internal Server Error";
    if (error instanceof Error) {
      msg = error.message;
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
