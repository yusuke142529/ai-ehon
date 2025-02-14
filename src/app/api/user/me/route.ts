export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"; // NextRequest を削除
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prismadb";

/**
 * GET /api/user/me
 * 現在ログイン中のユーザー情報を返す (User.id は string 型)。
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ユーザーIDを文字列として取得
    const userId = session.user.id; // string

    // (A) DBからユーザーデータ取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
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

    let message = "Internal Server Error";
    if (error instanceof Error) {
      message = error.message;
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
