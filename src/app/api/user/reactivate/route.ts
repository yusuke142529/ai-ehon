export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prismadb";
import { NextResponse } from "next/server";

/**
 * POST /api/user/reactivate
 *  - Body: { email: string }
 *  - 退会済み (deletedAt != null) のユーザーを再有効化 (deletedAt = null)
 *
 * セキュリティ注意:
 *  メールさえ分かれば再有効化できる。本人確認等が必要な場合は別途実装。
 */

// 他メソッドをブロック (GET, PUT, DELETE, PATCH)
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
export async function PUT() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
export async function DELETE() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
export async function PATCH() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1) ユーザー検索
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "該当ユーザーが存在しません" }, { status: 404 });
    }
    if (!user.deletedAt) {
      return NextResponse.json({ error: "このアカウントは既に有効です" }, { status: 400 });
    }

    // 2) 再有効化
    await prisma.user.update({
      where: { email },
      data: { deletedAt: null },
    });

    return NextResponse.json({ message: "再有効化が完了しました" }, { status: 200 });
  } catch (err: any) {
    console.error("[reactivate]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}