// src/app/api/user/me/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prismadb";

/**
 * GET /api/user/me
 * 現在ログイン中のユーザー情報を返す (User.id は String 型)。
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ★ ユーザーIDを文字列として取得
    const userId = session.user.id; // string

    // (A) DBからユーザーデータ取得 (User.id は String の想定)
    const user = await prisma.user.findUnique({
      where: { id: userId }, // 文字列
      select: {
        id: true,
        email: true,
        name: true,
        image: true, // iconUrl -> image
        points: true,
        deletedAt: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // (B) 退会済みなら403
    if (user.deletedAt) {
      return NextResponse.json({ error: "User is deleted" }, { status: 403 });
    }

    // (C) 正常 => ユーザー情報を返す
    return NextResponse.json({ user }, { status: 200 });

  } catch (error: unknown) {
    console.error("[GET /api/user/me]", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal Server Error" },
      { status: 500 }
    );
  }
}