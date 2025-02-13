// src/app/api/user/deleteAccount/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prismadb";

/**
 * DELETE /api/user/deleteAccount
 *  1) ログインユーザーを特定 (session.user.id は string)
 *  2) ポイントを0にし、deletedAt を現在時刻で更新
 *  3) pointHistory にマイナスレコードを作成 (任意)
 */
export async function DELETE() {
  try {
    // 1) セッション
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // userId は文字列（UUID）
    const userId = session.user.id; 
    // ここで Number(...) してはいけない

    // 2) ユーザーを取得
    const user = await prisma.user.findUnique({
      where: { id: userId }, // string UUID
      select: { points: true, deletedAt: true },
    });
    if (!user) {
      return NextResponse.json({ error: "ユーザーが存在しません" }, { status: 404 });
    }
    if (user.deletedAt) {
      return NextResponse.json({ error: "既に退会済みユーザーです" }, { status: 400 });
    }

    const currentPoints = user.points || 0;

    // 3) 退会トランザクション
    await prisma.$transaction(async (tx) => {
      // 任意: 残ポイントを失効させるため pointHistory にマイナス履歴を追加
      if (currentPoints > 0) {
        await tx.pointHistory.create({
          data: {
            userId: userId,
            changeAmount: -currentPoints,
            reason: "退会に伴う失効",
          },
        });
      }

      // 論理削除 + points=0
      await tx.user.update({
        where: { id: userId },
        data: {
          points: 0,
          deletedAt: new Date(),
        },
      });
    });

    // 4) レスポンス
    return NextResponse.json(
      { message: "退会処理が完了しました" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[deleteAccount]", error);
    return NextResponse.json(
      { error: error.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}