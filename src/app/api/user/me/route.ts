//src/app/api/user/me/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prismadb";

/**
 * GET /api/user/me
 * 現在ログイン中のユーザー情報を返す。
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    // (A) 退会チェック
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        iconUrl: true,
        points: true,
        deletedAt: true,   // 論理削除かどうか
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ★ (B) 退会済みなら403
    if (user.deletedAt) {
      return NextResponse.json({ error: "User is deleted" }, { status: 403 });
    }

    // (C) 正常 => ユーザー情報を返す
    return NextResponse.json({ user }, { status: 200 });

  } catch (error: unknown) {
    console.error("[GET /api/user/me]", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal Server Error" },
      { status: 500 },
    );
  }
}